import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { sendReservationEmail } from '../services/email'

export const publicRouter = Router()

// GET /api/public/lista/:slug
publicRouter.get('/lista/:slug', async (req, res) => {
  try {
    const list = await prisma.babyList.findUnique({
      where: { shareSlug: req.params.slug },
      include: {
        user: { select: { name: true, dueDate: true, babyGender: true } },
        items: {
          include: { product: { include: { category: true } }, reservation: true },
          orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }]
        }
      }
    })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    if (!list.isPublic) return res.status(403).json({ error: 'Lista je privatna' })
    res.json(list)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// GET /api/public/pretraga?q=Ana+Horvat
// Pretraga liste po imenu mame
publicRouter.get('/pretraga', async (req, res) => {
  try {
    const { q } = req.query as { q: string }
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Upiši najmanje 2 znaka' })
    }

    const lists = await prisma.babyList.findMany({
      where: {
        isPublic: true,
        OR: [
          { user: { name: { contains: q.trim(), mode: 'insensitive' } } },
          { name: { contains: q.trim(), mode: 'insensitive' } },
        ]
      },
      include: {
        user: { select: { name: true, dueDate: true, babyGender: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    res.json(lists)
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// POST /api/public/lista/:slug/rezerviraj/:itemId
publicRouter.post('/lista/:slug/rezerviraj/:itemId', async (req, res) => {
  try {
    const data = z.object({
      reservedBy: z.string().min(2, 'Ime mora imati najmanje 2 znaka').max(100),
      note: z.string().max(500).optional(),
    }).parse(req.body)

    const list = await prisma.babyList.findUnique({ where: { shareSlug: req.params.slug } })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    if (!list.isPublic) return res.status(403).json({ error: 'Lista je privatna' })

    const listItem = await prisma.listItem.findFirst({
      where: { id: req.params.itemId, listId: list.id },
      include: { reservation: true }
    })
    if (!listItem) return res.status(404).json({ error: 'Stavka nije pronađena' })
    if (listItem.reservation) {
      return res.status(409).json({ error: 'Ovaj proizvod je već rezerviran', reservedBy: listItem.reservation.reservedBy })
    }

    const reservation = await prisma.reservation.create({
      data: { listItemId: listItem.id, reservedBy: data.reservedBy, note: data.note }
    })

    // Email mami async
    prisma.babyList.findUnique({
      where: { id: list.id },
      include: {
        user: { select: { email: true, name: true } },
        items: { where: { id: listItem.id }, include: { product: true } }
      }
    }).then(fullData => {
      if (fullData?.user && fullData.items[0]?.product) {
        sendReservationEmail({
          mamaEmail: fullData.user.email,
          mamaName: fullData.user.name,
          listName: fullData.name,
          listSlug: fullData.shareSlug,
          productName: fullData.items[0].product.name,
          productPrice: fullData.items[0].product.price,
          productCurrency: fullData.items[0].product.currency,
          reservedBy: data.reservedBy,
          reservedNote: data.note,
        }).catch(console.error)
      }
    }).catch(console.error)

    res.status(201).json({
      success: true,
      message: `Hvala, ${data.reservedBy}! Rezervacija je uspješno pohranjena.`,
      reservation
    })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// PATCH /api/public/lista/:slug/rezerviraj/:itemId/status
publicRouter.patch('/lista/:slug/rezerviraj/:itemId/status', async (req, res) => {
  try {
    const { reservedBy, status } = req.body
    if (!['RESERVED', 'PURCHASED'].includes(status)) return res.status(400).json({ error: 'Nevažeći status' })
    const list = await prisma.babyList.findUnique({ where: { shareSlug: req.params.slug } })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    const listItem = await prisma.listItem.findFirst({
      where: { id: req.params.itemId, listId: list.id },
      include: { reservation: true }
    })
    if (!listItem?.reservation) return res.status(404).json({ error: 'Rezervacija nije pronađena' })
    if (listItem.reservation.reservedBy.toLowerCase() !== reservedBy?.toLowerCase()) {
      return res.status(403).json({ error: 'Pogrešno ime' })
    }
    const updated = await prisma.reservation.update({ where: { id: listItem.reservation.id }, data: { status } })
    res.json({ success: true, reservation: updated })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})

// DELETE /api/public/lista/:slug/rezerviraj/:itemId
publicRouter.delete('/lista/:slug/rezerviraj/:itemId', async (req, res) => {
  try {
    const { reservedBy } = req.body
    const list = await prisma.babyList.findUnique({ where: { shareSlug: req.params.slug } })
    if (!list) return res.status(404).json({ error: 'Lista nije pronađena' })
    const listItem = await prisma.listItem.findFirst({
      where: { id: req.params.itemId, listId: list.id },
      include: { reservation: true }
    })
    if (!listItem?.reservation) return res.status(404).json({ error: 'Rezervacija nije pronađena' })
    if (listItem.reservation.reservedBy.toLowerCase() !== reservedBy?.toLowerCase()) {
      return res.status(403).json({ error: 'Pogrešno ime' })
    }
    await prisma.reservation.delete({ where: { id: listItem.reservation.id } })
    res.json({ success: true, message: 'Rezervacija je uklonjena' })
  } catch { res.status(500).json({ error: 'Greška na serveru' }) }
})
