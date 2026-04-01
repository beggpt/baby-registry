import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

export const authRouter = Router()

const registerSchema = z.object({
  email: z.string().email('Nevažeća email adresa'),
  password: z.string().min(8, 'Lozinka mora imati najmanje 8 znakova'),
  name: z.string().min(2, 'Ime mora imati najmanje 2 znaka'),
  dueDate: z.string().optional(),
  babyGender: z.enum(['boy', 'girl', 'surprise']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return res.status(409).json({ error: 'Email je već registriran' })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        babyGender: data.babyGender,
      },
      select: { id: true, email: true, name: true, dueDate: true, babyGender: true }
    })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' })
    res.status(201).json({ user, token })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message })
    }
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      return res.status(401).json({ error: 'Pogrešan email ili lozinka' })
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Pogrešan email ili lozinka' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' })
    res.json({
      user: { id: user.id, email: user.email, name: user.name, dueDate: user.dueDate, babyGender: user.babyGender },
      token
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message })
    }
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, name: true, dueDate: true, babyGender: true, createdAt: true }
    })
    if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// PATCH /api/auth/profile
authRouter.patch('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, dueDate, babyGender } = req.body
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { name, dueDate: dueDate ? new Date(dueDate) : undefined, babyGender },
      select: { id: true, email: true, name: true, dueDate: true, babyGender: true }
    })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})
