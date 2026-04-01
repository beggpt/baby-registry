'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { adminApi } from '@/lib/api'
import { RefreshCw, CheckCircle, XCircle, Clock, Package, Users, List, Gift } from 'lucide-react'
import { format } from 'date-fns'
import { hr } from 'date-fns/locale'
import clsx from 'clsx'

interface Shop {
  id: string
  name: string
  slug: string
  baseUrl: string
  isActive: boolean
  lastRun?: string
  lastStatus?: string
  errorMsg?: string
  productsCount: number
}

interface Stats {
  usersCount: number
  listsCount: number
  productsCount: number
  reservationsCount: number
}

export default function AdminPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    try {
      const [shopsRes, statsRes] = await Promise.all([
        adminApi.getShops(),
        adminApi.getStats(),
      ])
      setShops(shopsRes.data)
      setStats(statsRes.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleScrape = async (slug: string) => {
    setScraping(p => ({ ...p, [slug]: true }))
    try {
      await adminApi.triggerScrape(slug)
      showToast(`Scraping pokrenuti za ${slug}! Provjerite logove.`)
      // Osvježi status nakon kratke pauze
      setTimeout(fetchData, 3000)
    } catch {
      showToast('Greška pri pokretanju scrapera')
    } finally {
      setTimeout(() => setScraping(p => ({ ...p, [slug]: false })), 3000)
    }
  }

  const statCards = stats ? [
    { icon: <Users size={20} className="text-purple-500" />, label: 'Korisnici', value: stats.usersCount, bg: 'bg-purple-50' },
    { icon: <List size={20} className="text-rose" />, label: 'Liste', value: stats.listsCount, bg: 'bg-rose/5' },
    { icon: <Package size={20} className="text-sage" />, label: 'Proizvodi', value: stats.productsCount, bg: 'bg-sage-light/40' },
    { icon: <Gift size={20} className="text-gold" />, label: 'Rezervacije', value: stats.reservationsCount, bg: 'bg-gold/10' },
  ] : []

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="py-8">
            <h1 className="font-serif text-3xl text-charcoal mb-1">Admin panel</h1>
            <p className="text-warm-gray text-sm">Upravljanje scraperom i statistike sustava</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {statCards.map((card, i) => (
                <div key={i} className={clsx('rounded-2xl p-5 border border-blush/20', card.bg)}>
                  <div className="mb-3">{card.icon}</div>
                  <p className="text-2xl font-serif text-charcoal">{card.value.toLocaleString('hr-HR')}</p>
                  <p className="text-xs text-warm-gray mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Shopovi / Scraperi */}
          <h2 className="font-serif text-xl text-charcoal mb-4">Scraped shopovi</h2>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-blush/30 shimmer" />
              ))
            ) : shops.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-blush/30">
                <p className="text-warm-gray text-sm">Nema konfiguriranih shopova</p>
              </div>
            ) : (
              shops.map(shop => (
                <div key={shop.id} className="bg-white rounded-2xl border border-blush/30 p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        'w-2.5 h-2.5 rounded-full flex-shrink-0',
                        shop.lastStatus === 'success' ? 'bg-sage' :
                        shop.lastStatus === 'error' ? 'bg-rose' :
                        shop.lastStatus === 'running' ? 'bg-gold animate-pulse' :
                        'bg-warm-gray/30'
                      )} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-charcoal">{shop.name}</h3>
                          <a
                            href={shop.baseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-warm-gray hover:text-sage transition-colors"
                          >
                            {shop.baseUrl}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-warm-gray flex items-center gap-1">
                            <Package size={10} />
                            {shop.productsCount.toLocaleString('hr-HR')} proizvoda
                          </span>
                          {shop.lastRun && (
                            <span className="text-xs text-warm-gray flex items-center gap-1">
                              <Clock size={10} />
                              {format(new Date(shop.lastRun), 'd. MMM yyyy HH:mm', { locale: hr })}
                            </span>
                          )}
                          {shop.lastStatus && (
                            <span className={clsx(
                              'text-xs flex items-center gap-1 font-medium',
                              shop.lastStatus === 'success' ? 'text-sage' :
                              shop.lastStatus === 'error' ? 'text-rose' :
                              shop.lastStatus === 'running' ? 'text-gold' :
                              'text-warm-gray'
                            )}>
                              {shop.lastStatus === 'success' && <CheckCircle size={10} />}
                              {shop.lastStatus === 'error' && <XCircle size={10} />}
                              {shop.lastStatus === 'running' && <RefreshCw size={10} className="animate-spin" />}
                              {shop.lastStatus}
                            </span>
                          )}
                        </div>
                        {shop.lastStatus === 'error' && shop.errorMsg && (
                          <p className="text-xs text-rose/70 mt-1 max-w-lg truncate">{shop.errorMsg}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleScrape(shop.slug)}
                      disabled={scraping[shop.slug] || shop.lastStatus === 'running'}
                      className="flex items-center gap-2 px-4 py-2 bg-sage-light/60 text-sage text-sm font-medium rounded-full hover:bg-sage-light transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={scraping[shop.slug] ? 'animate-spin' : ''} />
                      {scraping[shop.slug] ? 'Pokrećem...' : 'Pokreni scraper'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Upute */}
          <div className="mt-8 p-5 bg-white rounded-2xl border border-blush/30">
            <h3 className="font-medium text-charcoal mb-3">ℹ️ Upute za scraping</h3>
            <div className="text-sm text-warm-gray space-y-2">
              <p>• Scraper automatski radi svaku noć u <strong>02:00</strong></p>
              <p>• Ručno pokretanje može trajati <strong>15-45 minuta</strong> ovisno o broju kategorija</p>
              <p>• Scraper koristi Playwright (headless Chromium) — trebaš ga instalirati s <code className="bg-cream px-1 py-0.5 rounded text-xs">npx playwright install chromium</code></p>
              <p>• Status "running" znači da je scraper aktivan u pozadini — refresh stranicu za ažurni status</p>
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-charcoal text-white text-sm rounded-full shadow-2xl fade-in">
          {toast}
        </div>
      )}
    </>
  )
}
