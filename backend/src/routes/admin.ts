import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { runBabyCenterScraper } from '../scraper/babycenter'

export const adminRouter = Router()

// GET /api/admin/stats
adminRouter.get('/stats', async (_, res) => {
  try {
    const [usersCount, listsCount, productsCount, reservationsCount] = await Promise.all([
      prisma.user.count(),
      prisma.babyList.count(),
      prisma.product.count(),
      prisma.reservation.count(),
    ])
    res.json({ usersCount, listsCount, productsCount, reservationsCount })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// GET /api/admin/users
adminRouter.get('/users', async (req, res) => {
  try {
    const { page = '1', q } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * 20
    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true,
          dueDate: true, babyGender: true, createdAt: true,
          _count: { select: { lists: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip, take: 20
      }),
      prisma.user.count({ where })
    ])
    res.json({ users, total, totalPages: Math.ceil(total / 20) })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// GET /api/admin/users/:id
adminRouter.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        lists: {
          include: {
            _count: { select: { items: true } },
            items: { include: { reservation: true } }
          }
        }
      }
    })
    if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' })
    const { passwordHash, ...safeUser } = user as any
    res.json(safeUser)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    if (!['USER', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'Nevažeći role' })
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true }
    })
    res.json(user)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// GET /api/admin/shops
adminRouter.get('/shops', async (_, res) => {
  try {
    const shops = await prisma.scrapedShop.findMany({ orderBy: { name: 'asc' } })
    res.json(shops)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// PATCH /api/admin/shops/:slug/toggle — toggle shop isActive
adminRouter.patch('/shops/:slug/toggle', async (req, res) => {
  try {
    const shop = await prisma.scrapedShop.findUnique({ where: { slug: req.params.slug } })
    if (!shop) return res.status(404).json({ error: 'Shop nije pronađen' })
    const updated = await prisma.scrapedShop.update({
      where: { slug: req.params.slug },
      data: { isActive: !shop.isActive }
    })
    res.json(updated)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// POST /api/admin/shops/:slug/scrape
adminRouter.post('/shops/:slug/scrape', async (req, res) => {
  const { slug } = req.params
  res.json({ message: `Scraping pokrenut za ${slug}.` })
  if (slug === 'babycenter') runBabyCenterScraper().catch(console.error)
})

// GET /api/admin/featured
adminRouter.get('/featured', async (_, res) => {
  try {
    const featured = await prisma.featuredProduct.findMany({
      include: { product: { include: { category: true } } },
      orderBy: { position: 'asc' }
    })
    res.json(featured)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// POST /api/admin/featured
adminRouter.post('/featured', async (req, res) => {
  try {
    const { productId } = req.body
    if (!productId) return res.status(400).json({ error: 'productId je obavezan' })
    const existing = await prisma.featuredProduct.findFirst({ where: { productId } })
    if (existing) return res.status(409).json({ error: 'Proizvod je već istaknut' })
    const count = await prisma.featuredProduct.count()
    const featured = await prisma.featuredProduct.create({
      data: { productId, position: count },
      include: { product: true }
    })
    res.status(201).json(featured)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// DELETE /api/admin/featured/:id
adminRouter.delete('/featured/:id', async (req, res) => {
  try {
    await prisma.featuredProduct.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// GET /api/admin/settings
adminRouter.get('/settings', async (_, res) => {
  try {
    const settings = await prisma.appSetting.findMany()
    const map: Record<string, string> = {}
    settings.forEach(s => map[s.key] = s.value)
    res.json(map)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// PUT /api/admin/settings/:key
adminRouter.put('/settings/:key', async (req, res) => {
  try {
    const { value } = req.body
    const setting = await prisma.appSetting.upsert({
      where: { key: req.params.key },
      create: { key: req.params.key, value },
      update: { value }
    })
    res.json(setting)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// GET /api/admin/products
adminRouter.get('/products', async (req, res) => {
  try {
    const { page = '1', q, shop } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * 50
    const where: any = {}
    if (shop) where.shopSlug = shop
    if (q) where.name = { contains: q, mode: 'insensitive' }
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: { category: true }, orderBy: { lastScraped: 'desc' }, skip, take: 50 }),
      prisma.product.count({ where })
    ])
    res.json({ products, total, totalPages: Math.ceil(total / 50) })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// ===== CATEGORY MAPPINGS =====

// GET /api/admin/category-mappings
adminRouter.get('/category-mappings', async (_, res) => {
  try {
    const mappings = await prisma.categoryMapping.findMany({
      include: { category: true },
      orderBy: { externalName: 'asc' }
    })
    res.json(mappings)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// POST /api/admin/category-mappings
adminRouter.post('/category-mappings', async (req, res) => {
  try {
    const { externalName, shopSlug, categoryId } = req.body
    if (!externalName || !categoryId) {
      return res.status(400).json({ error: 'externalName i categoryId su obavezni' })
    }
    const mapping = await prisma.categoryMapping.create({
      data: { externalName, shopSlug: shopSlug || null, categoryId },
      include: { category: true }
    })
    res.status(201).json(mapping)
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Ovo mapiranje već postoji' })
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// DELETE /api/admin/category-mappings/:id
adminRouter.delete('/category-mappings/:id', async (req, res) => {
  try {
    await prisma.categoryMapping.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// GET /api/admin/unmapped-categories — external category names from products without mappings
adminRouter.get('/unmapped-categories', async (_, res) => {
  try {
    // Get all distinct external category names from products (using category name)
    const products = await prisma.product.findMany({
      where: { category: { isNot: null } },
      select: { category: { select: { name: true } }, shopSlug: true },
      distinct: ['categoryId'],
    })

    const mappings = await prisma.categoryMapping.findMany({
      select: { externalName: true, shopSlug: true }
    })

    const mappedSet = new Set(mappings.map(m => `${m.externalName}||${m.shopSlug || ''}`))

    // Find category names from products that are not in mappings
    const unmapped: Array<{ externalName: string; shopSlug: string; count: number }> = []
    const seen = new Set<string>()

    for (const p of products) {
      if (!p.category) continue
      const key = `${p.category.name}||${p.shopSlug}`
      if (seen.has(key) || mappedSet.has(key)) continue
      seen.add(key)

      const count = await prisma.product.count({
        where: {
          category: { name: p.category.name },
          shopSlug: p.shopSlug
        }
      })

      unmapped.push({
        externalName: p.category.name,
        shopSlug: p.shopSlug,
        count
      })
    }

    unmapped.sort((a, b) => b.count - a.count)
    res.json(unmapped)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// GET /api/admin/categories — all categories for dropdown
adminRouter.get('/categories', async (_, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { parent: true },
      orderBy: { name: 'asc' }
    })
    res.json(categories)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// DEBUG
adminRouter.get('/debug-scrape', async (_, res) => {
  try {
    const axios = require('axios')
    const cheerio = require('cheerio')
    const response = await axios.get('https://www.babycenter.hr/kolica/kolica', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
    })
    const $ = cheerio.load(response.data)
    const itemCardCount = $('[id^="itemCard"]').length
    const firstDataJson = $('[id^="itemCard"]').first().attr('data-json') || 'NEMA'
    res.json({ itemCardCount, firstDataJson: firstDataJson.substring(0, 500), htmlLength: response.data.length })
  } catch (err) { res.status(500).json({ error: String(err) }) }
})
