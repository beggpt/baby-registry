'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { adminApi, productsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Product, AdminUser } from '@/types'
import { RefreshCw, Search, Shield, X } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'overview' | 'users' | 'scraper' | 'featured' | 'settings'

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading, loadFromStorage } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<any>(null)
  const [recentLists, setRecentLists] = useState<any[]>([])
  const [shops, setShops] = useState<any[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [featured, setFeatured] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [scraping, setScraping] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [heroUrl, setHeroUrl] = useState('')
  const [heroSaving, setHeroSaving] = useState(false)
  const [selectedUserList, setSelectedUserList] = useState<any>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { loadFromStorage() }, [])
  useEffect(() => {
    if (!isLoading && user && user.role !== 'ADMIN') router.push('/')
    if (!isLoading && !user) router.push('/prijava')
  }, [user, isLoading])

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data)).catch(() => {})
    adminApi.getShops().then(r => setShops(r.data)).catch(() => {})
    adminApi.getFeatured().then(r => setFeatured(r.data)).catch(() => {})
    adminApi.getSettings().then(r => { setSettings(r.data); setHeroUrl(r.data.heroImage || '') }).catch(() => {})
    // Load recent users lists for overview
    adminApi.getUsers({ page: 1 }).then(r => {
      setRecentLists(r.data.users || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab !== 'users') return
    adminApi.getUsers({ page: userPage, q: userSearch || undefined })
      .then(r => { setUsers(r.data.users); setUsersTotal(r.data.total) }).catch(() => {})
  }, [tab, userPage, userSearch])

  useEffect(() => {
    if (tab !== 'featured') return
    productsApi.getAll({ q: productSearch || undefined, limit: 12 })
      .then(r => setProducts(r.data.products)).catch(() => {})
  }, [tab, productSearch])

  const handleScrape = async (slug: string) => {
    setScraping(p => ({ ...p, [slug]: true }))
    try {
      await adminApi.triggerScrape(slug)
      showToast(`Scraping pokrenut za ${slug}!`)
      setTimeout(() => adminApi.getShops().then(r => setShops(r.data)), 3000)
    } catch { showToast('Greška') }
    finally { setTimeout(() => setScraping(p => ({ ...p, [slug]: false })), 3000) }
  }

  const handleToggleFeatured = async (product: Product) => {
    const existing = featured.find(f => f.productId === product.id)
    if (existing) {
      await adminApi.removeFeatured(existing.id)
      setFeatured(f => f.filter(x => x.id !== existing.id))
      showToast('Uklonjeno')
    } else {
      const res = await adminApi.addFeatured(product.id)
      setFeatured(f => [...f, res.data])
      showToast('Dodano! ⭐')
    }
  }

  const handleRoleToggle = async (u: AdminUser) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN'
    await adminApi.setUserRole(u.id, newRole)
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole as any } : x))
    showToast(`${u.name} je sada ${newRole}`)
  }

  const loadUserDetail = async (userId: string) => {
    try {
      const res = await adminApi.getUser(userId)
      setSelectedUserList(res.data)
    } catch { showToast('Greška pri učitavanju') }
  }

  const TABS = [
    { key: 'overview', label: 'Pregled', icon: '📊' },
    { key: 'users', label: 'Korisnici', icon: '👥' },
    { key: 'scraper', label: 'Scraper', icon: '🕷️' },
    { key: 'featured', label: 'Istaknuti', icon: '⭐' },
    { key: 'settings', label: 'Postavke', icon: '⚙️' },
  ]

  if (isLoading) return null

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-charcoal">Admin panel</h1>
              <p className="text-warm-gray text-sm mt-1">Upravljanje Bebinom Listom</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose/10 text-rose rounded-full text-sm">
              <Shield size={14} /> Admin
            </div>
          </div>

          <div className="flex gap-1 bg-white rounded-2xl p-1 border border-blush/30 mb-8 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key as Tab)}
                className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                  tab === t.key ? 'bg-rose text-white' : 'text-warm-gray hover:text-charcoal')}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: '👥', label: 'Korisnici', value: stats.usersCount },
                    { icon: '📋', label: 'Liste', value: stats.listsCount },
                    { icon: '📦', label: 'Proizvodi', value: stats.productsCount },
                    { icon: '🎁', label: 'Rezervacije', value: stats.reservationsCount },
                  ].map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-blush/30">
                      <div className="text-3xl mb-2">{card.icon}</div>
                      <p className="text-2xl font-serif text-charcoal">{card.value?.toLocaleString('hr-HR')}</p>
                      <p className="text-xs text-warm-gray mt-0.5">{card.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Korisnici i njihove liste */}
              <div className="bg-white rounded-2xl border border-blush/30 p-5">
                <h2 className="font-serif text-xl text-charcoal mb-4">Zadnji korisnici i njihove liste</h2>
                <div className="space-y-3">
                  {recentLists.slice(0, 10).map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3 p-3 border border-blush/20 rounded-2xl">
                      <div className="w-9 h-9 bg-blush/40 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-rose">{u.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal">{u.name}</p>
                        <p className="text-xs text-warm-gray">{u.email} · {u._count?.lists || 0} lista</p>
                      </div>
                      <button
                        onClick={() => loadUserDetail(u.id)}
                        className="text-xs px-3 py-1.5 bg-sage-light/60 text-sage rounded-full hover:bg-sage-light transition-colors flex-shrink-0"
                      >
                        Vidi liste
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* User detail modal */}
              {selectedUserList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/30 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif text-xl">Liste korisnika: {selectedUserList.name}</h3>
                      <button onClick={() => setSelectedUserList(null)} className="p-1.5 hover:bg-cream rounded-full">
                        <X size={18} className="text-warm-gray" />
                      </button>
                    </div>
                    {selectedUserList.lists?.length === 0 ? (
                      <p className="text-warm-gray text-sm text-center py-8">Korisnik nema lista.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedUserList.lists?.map((list: any) => (
                          <a key={list.id} href={`/lista/${list.shareSlug}`} target="_blank"
                            className="block p-4 border border-blush/30 rounded-2xl hover:border-blush-mid transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-charcoal">{list.name}</p>
                                <p className="text-xs text-warm-gray mt-0.5">{list._count?.items || 0} stavki</p>
                              </div>
                              <span className="text-xs text-rose">/lista/{list.shareSlug.slice(0, 8)}...</span>
                            </div>
                            {list.items?.some((i: any) => i.reservation) && (
                              <p className="text-xs text-sage mt-2">✓ {list.items.filter((i: any) => i.reservation).length} rezervirano</p>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div>
              <div className="flex gap-3 mb-5">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                  <input type="text" placeholder="Pretraži korisnike..." value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none" />
                </div>
                <span className="text-sm text-warm-gray self-center">{usersTotal} korisnika</span>
              </div>
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="bg-white rounded-2xl border border-blush/30 p-4 flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 bg-blush/40 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-rose">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-charcoal">{u.name}</p>
                        {u.role === 'ADMIN' && <span className="px-2 py-0.5 bg-rose/10 text-rose text-xs rounded-full font-medium">Admin</span>}
                      </div>
                      <p className="text-sm text-warm-gray">{u.email}</p>
                      <p className="text-xs text-warm-gray/60 mt-0.5">{u._count.lists} lista · {new Date(u.createdAt).toLocaleDateString('hr-HR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadUserDetail(u.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-sage-light/60 text-sage rounded-full hover:bg-sage-light transition-colors">
                        Vidi liste
                      </button>
                      <button onClick={() => handleRoleToggle(u)}
                        className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                          u.role === 'ADMIN' ? 'bg-rose/10 text-rose hover:bg-rose/20' : 'bg-sage-light/60 text-sage hover:bg-sage-light')}>
                        <Shield size={12} />
                        {u.role === 'ADMIN' ? 'Ukloni admin' : 'Postavi admin'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {usersTotal > 20 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
                    className="px-4 py-2 border border-blush/40 rounded-full text-sm disabled:opacity-40">← Prethodna</button>
                  <span className="px-4 py-2 text-sm text-warm-gray">Str. {userPage}</span>
                  <button onClick={() => setUserPage(p => p + 1)} disabled={users.length < 20}
                    className="px-4 py-2 border border-blush/40 rounded-full text-sm disabled:opacity-40">Sljedeća →</button>
                </div>
              )}
              {selectedUserList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/30 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif text-xl">Liste: {selectedUserList.name}</h3>
                      <button onClick={() => setSelectedUserList(null)} className="p-1.5 hover:bg-cream rounded-full"><X size={18} className="text-warm-gray" /></button>
                    </div>
                    {selectedUserList.lists?.length === 0 ? (
                      <p className="text-warm-gray text-sm text-center py-8">Korisnik nema lista.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedUserList.lists?.map((list: any) => (
                          <a key={list.id} href={`/lista/${list.shareSlug}`} target="_blank"
                            className="block p-4 border border-blush/30 rounded-2xl hover:border-blush-mid transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-charcoal">{list.name}</p>
                                <p className="text-xs text-warm-gray mt-0.5">{list._count?.items || 0} stavki</p>
                              </div>
                              <span className="text-xs text-rose">/lista/{list.shareSlug.slice(0, 8)}...</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCRAPER */}
          {tab === 'scraper' && (
            <div className="space-y-4">
              {shops.map(shop => (
                <div key={shop.id} className="bg-white rounded-2xl border border-blush/30 p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={clsx('w-2.5 h-2.5 rounded-full',
                        shop.lastStatus === 'success' ? 'bg-sage' : shop.lastStatus === 'error' ? 'bg-rose' : 'bg-warm-gray/30')} />
                      <div>
                        <h3 className="font-medium text-charcoal">{shop.name}</h3>
                        <p className="text-xs text-warm-gray">{shop.productsCount?.toLocaleString('hr-HR')} proizvoda · {shop.lastStatus || 'nije pokrenut'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleScrape(shop.slug)} disabled={scraping[shop.slug]}
                      className="flex items-center gap-2 px-4 py-2 bg-sage-light/60 text-sage text-sm font-medium rounded-full hover:bg-sage-light transition-colors disabled:opacity-50">
                      <RefreshCw size={14} className={scraping[shop.slug] ? 'animate-spin' : ''} />
                      {scraping[shop.slug] ? 'Pokrećem...' : 'Pokreni scraper'}
                    </button>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-cream rounded-2xl text-sm text-warm-gray">
                💡 Scraper automatski radi svake noći u <strong>02:00</strong>.
              </div>
            </div>
          )}

          {/* FEATURED */}
          {tab === 'featured' && (
            <div>
              <div className="mb-6">
                <h2 className="font-serif text-xl text-charcoal mb-2">Istaknuti proizvodi ({featured.length}/12)</h2>
              </div>
              {featured.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-warm-gray uppercase tracking-wide mb-3">Trenutno istaknuti</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {featured.map((f: any) => (
                      <div key={f.id} className="bg-white rounded-2xl border border-gold/30 p-3 relative">
                        <button onClick={() => adminApi.removeFeatured(f.id).then(() => setFeatured(prev => prev.filter(x => x.id !== f.id))).then(() => showToast('Uklonjeno'))}
                          className="absolute top-2 right-2 p-1 bg-rose/10 text-rose rounded-full hover:bg-rose/20">
                          <X size={12} />
                        </button>
                        {f.product?.imageUrl && <img src={f.product.imageUrl} alt="" className="w-full h-24 object-contain mb-2" />}
                        <p className="text-xs font-medium text-charcoal line-clamp-2">{f.product?.name}</p>
                        <p className="text-xs text-rose mt-0.5">{f.product?.price?.toFixed(2)} €</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h3 className="text-sm font-medium text-warm-gray uppercase tracking-wide mb-3">Dodaj proizvod</h3>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                <input type="text" placeholder="Pretraži proizvode..." value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map(product => {
                  const isFeatured = featured.some(f => f.productId === product.id)
                  return (
                    <button key={product.id} onClick={() => handleToggleFeatured(product)}
                      className={clsx('bg-white rounded-2xl border p-3 text-left transition-all hover:shadow-md',
                        isFeatured ? 'border-gold/40 bg-gold/5' : 'border-blush/30')}>
                      {product.imageUrl && <img src={product.imageUrl} alt="" className="w-full h-20 object-contain mb-2" />}
                      <p className="text-xs font-medium text-charcoal line-clamp-2">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-rose">{product.price.toFixed(2)} €</p>
                        {isFeatured ? <span className="text-xs text-gold">⭐</span> : <span className="text-xs text-warm-gray/40">+</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-2xl border border-blush/30 p-6">
                <h2 className="font-serif text-xl text-charcoal mb-4">Hero slika</h2>
                <div className="space-y-3">
                  <input type="url" placeholder="https://..." value={heroUrl} onChange={e => setHeroUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose" />
                  {heroUrl && (
                    <div className="rounded-xl overflow-hidden border border-blush/30 h-40">
                      <img src={heroUrl} alt="Hero preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <button onClick={async () => { setHeroSaving(true); try { await adminApi.setSetting('heroImage', heroUrl); showToast('Spremljeno!') } catch {} finally { setHeroSaving(false) } }}
                    disabled={heroSaving} className="px-5 py-2.5 bg-rose text-white rounded-full text-sm font-medium hover:bg-rose/90 disabled:opacity-50">
                    {heroSaving ? 'Sprema...' : 'Spremi hero sliku'}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-blush/30 p-6">
                <h2 className="font-serif text-xl text-charcoal mb-4">Opće postavke</h2>
                {[
                  { key: 'siteName', label: 'Naziv stranice', placeholder: 'Bebina Lista' },
                  { key: 'contactEmail', label: 'Kontakt email', placeholder: 'info@bebinalista.hr' },
                ].map(s => (
                  <div key={s.key} className="mb-4">
                    <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">{s.label}</label>
                    <input type="text" placeholder={s.placeholder} defaultValue={settings[s.key] || ''}
                      onBlur={e => adminApi.setSetting(s.key, e.target.value).then(() => showToast('Spremljeno!')).catch(() => {})}
                      className="w-full px-4 py-2.5 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-charcoal text-white text-sm rounded-full shadow-2xl fade-in">{toast}</div>
      )}
    </>
  )
}
