import { Router } from 'express'
import { prisma } from '../utils/prisma'

export const productsRouter = Router()

// GET /api/products
productsRouter.get('/', async (req, res) => {
  try {
    const {
      q, categoryId, categorySlug, shopSlug,
      minPrice, maxPrice, inStock,
      page = '1', limit = '24', sortBy = 'name',
    } = req.query as Record<string, string>

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = Math.min(parseInt(limit), 100)
    const where: any = {}

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (shopSlug) where.shopSlug = shopSlug
    if (inStock === 'true') where.inStock = true
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
      if (category) {
        const children = await prisma.category.findMany({ where: { parentId: category.id } })
        where.categoryId = { in: [category.id, ...children.map(c => c.id)] }
      }
    } else if (categoryId) {
      where.categoryId = categoryId
    }

    let orderBy: any = { name: 'asc' }
    if (sortBy === 'price_asc') orderBy = { price: 'asc' }
    if (sortBy === 'price_desc') orderBy = { price: 'desc' }
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: { category: true }, orderBy, skip, take }),
      prisma.product.count({ where })
    ])

    // Raspon cijena za filter
    const priceRange = await prisma.product.aggregate({
      where: q || shopSlug ? where : {},
      _min: { price: true },
      _max: { price: true },
    })

    res.json({
      products,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
      priceRange: { min: priceRange._min.price || 0, max: priceRange._max.price || 10000 }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// GET /api/products/categories - s točnim brojem proizvoda
productsRouter.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            _count: { select: { products: true } }
          }
        },
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    })

    // Za svaku top-level kategoriju zbroji i proizvode podkategorija
    const categoriesWithCounts = await Promise.all(categories.map(async (cat) => {
      const childIds = cat.children.map(c => c.id)
      const totalCount = await prisma.product.count({
        where: { categoryId: { in: [cat.id, ...childIds] } }
      })
      return { ...cat, totalCount }
    }))

    res.json(categoriesWithCounts)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// GET /api/products/featured
productsRouter.get('/featured', async (req, res) => {
  try {
    const featured = await prisma.featuredProduct.findMany({
      include: { product: { include: { category: true } } },
      orderBy: { position: 'asc' },
      take: 12
    })
    res.json(featured.map(f => f.product))
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// GET /api/products/:id
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
