import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

export const listsRouter = Router()

const reservationInclude = {
  contributors: { orderBy: { createdAt: 'asc' as const } }
}

// Mora biti PRIJE ruta koje ga koriste
const listItemInclude = {
  product: { include: { category: true } },
  reservation: { include: reservationInclude }
}

// Javna ruta - bez auth (mora biti PRIJE listsRouter.use(authMiddleware))
listsRouter.get('/public/:id', async (req, res) => {
  try {
    const list = await prisma.babyList.findFirst({
      where: { shareSlug: req.params.id, isPublic: true },
      include: {
        user: { select: { name: true } },
        items: {
          include: listItemInclude,
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
        }
      }
    })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    res.json(list)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

listsRouter.use(authMiddleware)

listsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const lists = await prisma.babyList.findMany({
      where: { userId: req.userId! },
      include: { _count: { select: { items: true } }, items: { include: listItemInclude } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(lists)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

listsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const data = z.object({
      name: z.string().min(2),
      occasion: z.enum(['birth', 'birthday', 'other']).optional(),
      description: z.string().optional(),
      isPublic: z.boolean().default(true),
    }).parse(req.body)
    const list = await prisma.babyList.create({ data: { ...data, userId: req.userId! } })
    res.status(201).json(list)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

listsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const list = await prisma.babyList.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        items: {
          include: listItemInclude,
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
        }
      }
    })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    res.json(list)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

listsRouter.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, description, isPublic, occasion } = req.body
    const updated = await prisma.babyList.updateMany({
      where: { id: req.params.id, userId: req.userId! },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
        ...(occasion !== undefined && { occasion }),
      }
    })
    if (updated.count === 0) return res.status(404).json({ error: 'Lista nije pronađena' })
    const list = await prisma.babyList.findUnique({ where: { id: req.params.id } })
    res.json(list)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

listsRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.babyList.deleteMany({ where: { id: req.params.id, userId: req.userId! } })
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

listsRouter.post('/:id/items', async (req: AuthRequest, res) => {
  try {
    const data = z.object({
      productId: z.string().optional(),
      customProduct: z.object({
        name: z.string().min(1),
        price: z.number().optional(),
        imageUrl: z.string().optional(),
        productUrl: z.string().optional(),
        description: z.string().optional(),
      }).optional(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
      note: z.string().optional(),
    }).parse(req.body)

    const list = await prisma.babyList.findFirst({ where: { id: req.params.id, userId: req.userId! } })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })

    let productId = data.productId

    // If customProduct provided, create a new Product record
    if (data.customProduct && !productId) {
      const product = await prisma.product.create({
        data: {
          name: data.customProduct.name,
          price: data.customProduct.price || 0,
          imageUrl: data.customProduct.imageUrl || null,
          productUrl: data.customProduct.productUrl || '',
          description: data.customProduct.description || null,
          shopName: 'Ručno dodano',
          shopSlug: 'custom',
          currency: 'EUR',
          inStock: true,
        }
      })
      productId = product.id
    }

    if (!productId) return res.status(400).json({ error: 'productId ili customProduct je obavezan' })

    const existing = await prisma.listItem.findFirst({ where: { listId: req.params.id, productId } })
    if (existing) return res.status(409).json({ error: 'Proizvod je već na listi' })

    const item = await prisma.listItem.create({
      data: { productId, priority: data.priority, note: data.note, listId: req.params.id },
      include: listItemInclude
    })
    res.status(201).json(item)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// POST /api/lists/smart-paste — extract product info from URL
listsRouter.post('/smart-paste', async (req: AuthRequest, res) => {
  try {
    const { url } = z.object({ url: z.string().url() }).parse(req.body)

    const axios = require('axios')
    const cheerio = require('cheerio')

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      maxRedirects: 5,
    })

    const $ = cheerio.load(response.data)

    // Extract title
    const title = $('meta[property="og:title"]').attr('content')
      || $('meta[name="twitter:title"]').attr('content')
      || $('title').text()
      || ''

    // Extract image
    const imageUrl = $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || ''

    // Extract description
    const description = $('meta[property="og:description"]').attr('content')
      || $('meta[name="description"]').attr('content')
      || ''

    // Extract shop name
    const shopName = $('meta[property="og:site_name"]').attr('content') || ''

    // Extract price - try multiple strategies
    let price: number | undefined

    // 1. JSON-LD product schema
    $('script[type="application/ld+json"]').each((_: number, el: any) => {
      try {
        const json = JSON.parse($(el).html() || '{}')
        const findPrice = (obj: any): number | undefined => {
          if (!obj) return undefined
          if (obj.offers?.price) return parseFloat(obj.offers.price)
          if (obj.offers?.[0]?.price) return parseFloat(obj.offers[0].price)
          if (Array.isArray(obj['@graph'])) {
            for (const item of obj['@graph']) {
              const p = findPrice(item)
              if (p) return p
            }
          }
          return undefined
        }
        const p = findPrice(json)
        if (p && !isNaN(p)) price = p
      } catch {}
    })

    // 2. Meta tags for price
    if (!price) {
      const metaPrice = $('meta[property="product:price:amount"]').attr('content')
        || $('meta[property="og:price:amount"]').attr('content')
      if (metaPrice) {
        const p = parseFloat(metaPrice)
        if (!isNaN(p)) price = p
      }
    }

    // 3. Common price patterns in HTML
    if (!price) {
      const priceText = $('.price, .product-price, [class*="price"], [data-price]').first().text()
      const match = priceText.match(/[\d.,]+/)
      if (match) {
        const p = parseFloat(match[0].replace(',', '.'))
        if (!isNaN(p) && p > 0) price = p
      }
    }

    res.json({
      title: title.trim(),
      imageUrl: imageUrl || undefined,
      description: description.trim() || undefined,
      price,
      shopName: shopName.trim() || undefined,
      productUrl: url,
    })
  } catch (err) {
    console.error('Smart paste error:', err)
    res.status(400).json({ error: 'Nije moguće dohvatiti podatke s tog linka' })
  }
})

listsRouter.patch('/:id/items/:itemId', async (req: AuthRequest, res) => {
  try {
    const list = await prisma.babyList.findFirst({ where: { id: req.params.id, userId: req.userId! } })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    const { priority, note } = req.body
    const item = await prisma.listItem.update({
      where: { id: req.params.itemId },
      data: { priority, note },
      include: listItemInclude
    })
    res.json(item)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

listsRouter.delete('/:id/items/:itemId', async (req: AuthRequest, res) => {
  try {
    const list = await prisma.babyList.findFirst({ where: { id: req.params.id, userId: req.userId! } })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    await prisma.listItem.delete({ where: { id: req.params.itemId } })
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})
