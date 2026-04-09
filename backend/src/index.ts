import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth'
import { listsRouter } from './routes/lists'
import { productsRouter } from './routes/products'
import { publicRouter } from './routes/public'
import { adminRouter } from './routes/admin'
import { scheduleScraper } from './scraper/scheduler'
import { prisma } from './utils/prisma'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://heroic-caring-production.up.railway.app',
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.replace('https://', '').replace('http://', '')))) {
      callback(null, true)
    } else {
      callback(null, true) // Allow all in dev
    }
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRouter)
app.use('/api/lists', listsRouter)
app.use('/api/products', productsRouter)
app.use('/api/public', publicRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

app.post('/api/run-scraper', async (_, res) => {
  res.json({ message: 'Scraper pokrenut!' })
  const { runBabyCenterScraper } = await import('./scraper/babycenter')
  runBabyCenterScraper().catch(console.error)
})

app.listen(PORT, async () => {
  console.log(`🚀 Baby Registry API na http://localhost:${PORT}`)
  scheduleScraper()

  // Ensure all shops exist in DB so they show in admin panel
  const shops = [
    { name: 'Baby Center', slug: 'babycenter', baseUrl: 'https://www.babycenter.hr' },
    { name: 'Svijet Beba', slug: 'svijetbeba', baseUrl: 'https://www.svijet-beba.hr' },
  ]
  for (const shop of shops) {
    await prisma.scrapedShop.upsert({
      where: { slug: shop.slug },
      create: { ...shop, isActive: true },
      update: {},
    }).catch(() => {})
  }
})
