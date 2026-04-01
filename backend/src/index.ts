import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth'
import { listsRouter } from './routes/lists'
import { productsRouter } from './routes/products'
import { publicRouter } from './routes/public'
import { adminRouter } from './routes/admin'
import { scheduleScraper } from './scraper/scheduler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Rute
app.use('/api/auth', authRouter)
app.use('/api/lists', listsRouter)
app.use('/api/products', productsRouter)
app.use('/api/public', publicRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Baby Registry API pokrenut na http://localhost:${PORT}`)
  scheduleScraper()
})
