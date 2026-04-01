import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

export const listsRouter = Router()
listsRouter.use(authMiddleware)

// GET /api/lists - sve liste korisnika
listsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const lists = await prisma.babyList.findMany({
      where: { userId: req.userId! },
      include: {
        _count: { select: { items: true } },
        items: {
          include: {
            reservation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(lists)
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// POST /api/lists - nova lista
listsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const data = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      isPublic: z.boolean().default(true),
    }).parse(req.body)

    const list = await prisma.babyList.create({
      data: { ...data, userId: req.userId! },
    })
    res.status(201).json(list)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// GET /api/lists/:id - jedna lista
listsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const list = await prisma.babyList.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            reservation: true
          },
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
        }
      }
    })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    res.json(list)
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// PATCH /api/lists/:id - ažuriranje liste
listsRouter.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, description, isPublic } = req.body
    const list = await prisma.babyList.updateMany({
      where: { id: req.params.id, userId: req.userId! },
      data: { name, description, isPublic }
    })
    if (list.count === 0) return res.status(404).json({ error: 'Lista nije pronađena' })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// DELETE /api/lists/:id
listsRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.babyList.deleteMany({
      where: { id: req.params.id, userId: req.userId! }
    })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// POST /api/lists/:id/items - dodaj proizvod na listu
listsRouter.post('/:id/items', async (req: AuthRequest, res) => {
  try {
    const data = z.object({
      productId: z.string(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
      note: z.string().optional(),
    }).parse(req.body)

    // Provjera vlasništva liste
    const list = await prisma.babyList.findFirst({
      where: { id: req.params.id, userId: req.userId! }
    })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })

    // Provjera duplikata
    const existing = await prisma.listItem.findFirst({
      where: { listId: req.params.id, productId: data.productId }
    })
    if (existing) return res.status(409).json({ error: 'Proizvod je već na listi' })

    const item = await prisma.listItem.create({
      data: { ...data, listId: req.params.id },
      include: { product: { include: { category: true } }, reservation: true }
    })
    res.status(201).json(item)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// PATCH /api/lists/:id/items/:itemId - ažuriranje stavke
listsRouter.patch('/:id/items/:itemId', async (req: AuthRequest, res) => {
  try {
    const { priority, note } = req.body

    // Provjera vlasništva
    const list = await prisma.babyList.findFirst({
      where: { id: req.params.id, userId: req.userId! }
    })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })

    const item = await prisma.listItem.update({
      where: { id: req.params.itemId },
      data: { priority, note },
      include: { product: true, reservation: true }
    })
    res.json(item)
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// DELETE /api/lists/:id/items/:itemId
listsRouter.delete('/:id/items/:itemId', async (req: AuthRequest, res) => {
  try {
    const list = await prisma.babyList.findFirst({
      where: { id: req.params.id, userId: req.userId! }
    })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })

    await prisma.listItem.delete({ where: { id: req.params.itemId } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})
