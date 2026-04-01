import { Router } from 'express'
import { prisma } from '../utils/prisma'

export const productsRouter = Router()

// GET /api/products - pretraživanje i filtriranje
productsRouter.get('/', async (req, res) => {
  try {
    const {
      q,           // search query
      categoryId,
      categorySlug,
      shopSlug,
      minPrice,
      maxPrice,
      inStock,
      page = '1',
      limit = '24',
      sortBy = 'name', // name | price_asc | price_desc
    } = req.query as Record<string, string>

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where: any = {}

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (categoryId) where.categoryId = categoryId
    if (shopSlug) where.shopSlug = shopSlug
    if (inStock === 'true') where.inStock = true

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    // Filtriranje po slug kategorije (uključuje podkategorije)
    if (categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
      if (category) {
        const childCategories = await prisma.category.findMany({
          where: { parentId: category.id }
        })
        const categoryIds = [category.id, ...childCategories.map(c => c.id)]
        where.categoryId = { in: categoryIds }
      }
    }

    let orderBy: any = { name: 'asc' }
    if (sortBy === 'price_asc') orderBy = { price: 'asc' }
    if (sortBy === 'price_desc') orderBy = { price: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take,
      }),
      prisma.product.count({ where })
    ])

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// GET /api/products/categories - sve kategorije
productsRouter.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: { _count: { select: { products: true } } }
        },
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    })
    res.json(categories)
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// GET /api/products/:id - jedan proizvod
productsRouter.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: { include: { parent: true } } }
    })
    if (!product) return res.status(404).json({ error: 'Proizvod nije pronađen' })
    res.json(product)
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})
