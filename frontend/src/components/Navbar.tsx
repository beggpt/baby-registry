'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Heart, User, LogOut, Menu, X, Shield } from 'lucide-react'
import clsx from 'clsx'

export default function Navbar() {
  const { user, logout, loadFromStorage } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    loadFromStorage()
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => { logout(); router.push('/') }
  const isActive = (href: string) => pathname === href

  return (
    <nav className={clsx('fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-blush/40' : 'bg-cream/80 backdrop-blur-sm')}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍼</span>
            <span className="font-serif text-xl text-charcoal">Bebina Lista</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/katalog" className={clsx('text-sm font-medium transition-colors', isActive('/katalog') ? 'text-rose' : 'text-warm-gray hover:text-charcoal')}>
              Katalog
            </Link>
            {user ? (
              <>
                <Link href="/moja-lista" className={clsx('text-sm font-medium transition-colors flex items-center gap-1.5', isActive('/moja-lista') ? 'text-rose' : 'text-warm-gray hover:text-charcoal')}>
                  <Heart size={14} /> Moja lista
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className={clsx('text-sm font-medium transition-colors flex items-center gap-1.5', isActive('/admin') ? 'text-rose' : 'text-warm-gray hover:text-charcoal')}>
                    <Shield size={14} /> Admin
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-2">
                  <Link href="/profil" className="flex items-center gap-1.5 text-sm text-warm-gray hover:text-charcoal transition-colors">
                    <User size={14} /> {user.name.split(' ')[0]}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-warm-gray hover:text-rose transition-colors">
                    <LogOut size={14} /> Odjava
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/prijava" className="text-sm font-medium text-warm-gray hover:text-charcoal transition-colors">Prijava</Link>
                <Link href="/registracija" className="px-4 py-2 bg-rose text-white text-sm font-medium rounded-full hover:bg-rose/90 transition-colors">
                  Kreiraj listu
                </Link>
              </div>
            )}
          </div>

          {/* Mobile */}
          <button className="md:hidden p-2 text-warm-gray" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-blush/40 px-4 py-4 space-y-3">
          <Link href="/katalog" className="block text-sm font-medium text-charcoal py-2" onClick={() => setMenuOpen(false)}>Katalog</Link>
          {user ? (
            <>
              <Link href="/moja-lista" className="block text-sm font-medium text-charcoal py-2" onClick={() => setMenuOpen(false)}>Moja lista</Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="block text-sm font-medium text-charcoal py-2" onClick={() => setMenuOpen(false)}>Admin panel</Link>
              )}
              <Link href="/profil" className="block text-sm font-medium text-charcoal py-2" onClick={() => setMenuOpen(false)}>Profil</Link>
              <button onClick={handleLogout} className="block text-sm font-medium text-rose py-2">Odjava</button>
            </>
          ) : (
            <>
              <Link href="/prijava" className="block text-sm font-medium text-charcoal py-2" onClick={() => setMenuOpen(false)}>Prijava</Link>
              <Link href="/registracija" className="block text-sm font-medium text-rose py-2" onClick={() => setMenuOpen(false)}>Kreiraj listu</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
