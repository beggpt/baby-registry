import { Request, Response, NextFunction } from 'express'

// Jednostavna admin zaštita za MVP
// U produkciji: dodaj admin role na User modelu
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const adminKey = req.headers['x-admin-key']
  const configuredKey = process.env.ADMIN_KEY

  // Ako ADMIN_KEY nije postavljen, dopusti samo u dev modu
  if (!configuredKey) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Admin pristup nije konfiguriran' })
    }
    return next()
  }

  if (adminKey !== configuredKey) {
    return res.status(403).json({ error: 'Nedozvoljen pristup' })
  }

  next()
}
