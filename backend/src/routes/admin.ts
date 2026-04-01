import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { adminMiddleware } from '../middleware/admin'
import { runBabyCenterScraper } from '../scraper/babycenter'

export const adminRouter = Router()
adminRouter.use(adminMiddleware)

// GET /api/admin/shops
adminRouter.get('/shops', async (_, res) => {
  try {
    const shops = await prisma.scrapedShop.findMany({ orderBy: { name: 'asc' } })
    res.json(shops)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// POST /api/admin/shops/:slug/scrape
adminRouter.post('/shops/:slug/scrape', async (req, res) => {
  const { slug } = req.params
  res.json({ message: `Scraping pokrenut za ${slug}. Prati logove servera.` })

  // Pokreni u pozadini
  if (slug === 'babycenter') {
    runBabyCenterScraper().catch(console.error)
  }
})

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

// GET /api/admin/products?shop=babycenter&page=1
adminRouter.get('/products', async (req, res) => {
  try {
    const { shop, page = '1', q } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * 50
    const where: any = {}
    if (shop) where.shopSlug = shop
    if (q) where.name = { contains: q, mode: 'insensitive' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, include: { category: true },
        orderBy: { lastScraped: 'desc' },
        skip, take: 50,
      }),
      prisma.product.count({ where })
    ])
    res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / 50) })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// DELETE /api/admin/products/:id
adminRouter.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})
