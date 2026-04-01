import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bebina Lista — Baby wish lista za nove roditelje',
  description: 'Napravi svoju baby wish listu i podijeli je s prijateljima. Neka pokloni budu točno ono što trebaš.',
  openGraph: {
    title: 'Bebina Lista',
    description: 'Baby wish lista za nove roditelje',
    siteName: 'Bebina Lista',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
