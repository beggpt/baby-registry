import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Potrebna prijava' })
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Nevažeći token' })
  }
}

export async function adminAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, async () => {
    const { prisma } = await import('../utils/prisma')
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { role: true } })
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedovoljna prava pristupa' })
    }
    next()
  })
}
