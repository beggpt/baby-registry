import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

export const listsRouter = Router()
// Javna ruta - bez auth
listsRouter.get('/public/:id', async (req, res) => {
  try {
    const list = await prisma.babyList.findFirst({
      where: { id: req.params.id, isPublic: true },
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

const listItemInclude = {
  product: { include: { category: true } },
  reservation: true
}

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

// PATCH - ažuriranje liste (ime, opis, prigoda, vidljivost)
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
      productId: z.string(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
      note: z.string().optional(),
    }).parse(req.body)
    const list = await prisma.babyList.findFirst({ where: { id: req.params.id, userId: req.userId! } })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    const existing = await prisma.listItem.findFirst({ where: { listId: req.params.id, productId: data.productId } })
    if (existing) return res.status(409).json({ error: 'Proizvod je već na listi' })
    const item = await prisma.listItem.create({
      data: { ...data, listId: req.params.id },
      include: listItemInclude
    })
    res.status(201).json(item)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    res.status(500).json({ error: 'Greška na serveru' })
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
