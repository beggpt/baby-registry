import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { sendWelcomeEmail } from '../services/email'

export const authRouter = Router()

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' })
}

function userSelect() {
  return { id: true, email: true, name: true, dueDate: true, babyGender: true, role: true }
}

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const data = z.object({
      email: z.string().email('Nevažeća email adresa'),
      password: z.string().min(6, 'Lozinka mora imati najmanje 6 znakova'),
      name: z.string().min(2, 'Ime mora imati najmanje 2 znaka'),
      dueDate: z.string().optional(),
      babyGender: z.enum(['boy', 'girl', 'surprise']).optional(),
    }).parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return res.status(409).json({ error: 'Email je već registriran' })

    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        babyGender: data.babyGender || null,
      },
      select: userSelect()
    })

    sendWelcomeEmail({ email: user.email, name: user.name }).catch(() => {})

    res.status(201).json({ user, token: makeToken(user.id) })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    console.error('Register error:', err)
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Pogrešan email ili lozinka' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Pogrešan email ili lozinka' })

    const safeUser = { id: user.id, email: user.email, name: user.name, dueDate: user.dueDate, babyGender: user.babyGender, role: user.role }
    res.json({ user: safeUser, token: makeToken(user.id) })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    res.status(500).json({ error: 'Greška na serveru' })
  }
})

// POST /api/auth/google
authRouter.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ error: 'Nedostaje Google token' })

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(501).json({ error: 'Google OAuth nije konfiguriran' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.email) return res.status(400).json({ error: 'Nevažeći Google token' })

    // Pronađi ili kreiraj korisnika
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          googleId: payload.sub,
        }
      })
      sendWelcomeEmail({ email: user.email, name: user.name }).catch(() => {})
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub }
      })
    }

    const safeUser = { id: user.id, email: user.email, name: user.name, dueDate: user.dueDate, babyGender: user.babyGender, role: user.role }
    res.json({ user: safeUser, token: makeToken(user.id) })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(500).json({ error: 'Google prijava nije uspjela' })
  }
})

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, name: true, dueDate: true, babyGender: true, role: true, createdAt: true }
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
      data: {
        name: name || undefined,
        dueDate: dueDate ? new Date(dueDate) : dueDate === '' ? null : undefined,
        babyGender: babyGender || null,
      },
      select: userSelect()
    })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'Greška na serveru' })
  }
})
