'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import { productsApi, listsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Product, Category, BabyList } from '@/types'
import { Search, X, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

function AddToListModal({ product, lists, onClose, onAdd }: {
  product: Product | null; lists: BabyList[]; onClose: () => void
  onAdd: (listId: string, priority: string) => void
}) {
  const [selectedList, setSelectedList] = useState(lists[0]?.id || '')
  const [priority, setPriority] = useState('MEDIUM')
  if (!product) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-charcoal/30 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl fade-up">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-serif text-xl text-charcoal">Dodaj na listu</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-full"><X size={18} className="text-warm-gray" /></button>
        </div>
        <div className="flex gap-3 mb-5 p-3 bg-cream rounded-2xl">
          <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
            {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">🍼</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal line-clamp-2">{product.name}</p>
            <p className="text-sm text-rose font-medium mt-0.5">
              {new Intl.NumberFormat('hr-HR', { style: 'currency', currency: product.currency || 'EUR' }).format(product.price)}
            </p>
          </div>
        </div>
        {lists.length === 0 ? (
          <p className="text-sm text-warm-gray text-center py-4">Nemaš listu. <a href="/moja-lista" className="text-rose underline">Kreiraj listu</a>.</p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Odaberi listu</label>
              <div className="space-y-2">
                {lists.map(list => (
                  <button key={list.id} onClick={() => setSelectedList(list.id)}
                    className={clsx('w-full text-left px-4 py-3 rounded-2xl border text-sm transition-all',
                      selectedList === list.id ? 'border-rose bg-blush/20 text-charcoal font-medium' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}>
                    {list.name} <span className="opacity-60 text-xs">({list._count?.items || 0} stavki)</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Prioritet</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ value: 'HIGH', label: '❤️ Jako', cls: 'priority-HIGH' },
                  { value: 'MEDIUM', label: '🌿 Srednje', cls: 'priority-MEDIUM' },
                  { value: 'LOW', label: '✨ Luksuz', cls: 'priority-LOW' }].map(p => (
                  <button key={p.value} onClick={() => setPriority(p.value)}
                    className={clsx('px-2 py-2.5 rounded-xl text-xs font-medium transition-all border text-center',
                      priority === p.value ? `${p.cls} border-current scale-105` : 'border-blush/30 text-warm-gray hover:border-blush-mid')}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => onAdd(selectedList, priority)} className="w-full py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors">
              Dodaj na listu
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const PRICE_PRESETS = [
  { label: 'Do 30€', min: '', max: '30' },
  { label: 'Do 50€', min: '', max: '50' },
  { label: '50–150€', min: '50', max: '150' },
  { label: '150–500€', min: '150', max: '500' },
  { label: '500€+', min: '500', max: '' },
]

export default function KatalogPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loadFromStorage } = useAuthStore()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userLists, setUserLists] = useState<BabyList[]>([])
  const [listProductIds, setListProductIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [categorySlug, setCategorySlug] = useState(searchParams.get('kategorija') || '')
  const [sortBy, setSortBy] = useState('price_asc')
  const [shopSlug, setShopSlug] = useState('')
  const [page, setPage] = useState(1)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => { loadFromStorage() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productsApi.getAll({
        q: query || undefined,
        categorySlug: categorySlug || undefined,
        shopSlug: shopSlug || undefined,
        sortBy, page, limit: 24,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      })
      setProducts(res.data.products)
      setPagination(res.data.pagination)
      if (res.data.priceRange) setPriceRange(res.data.priceRange)
    } catch {} finally { setLoading(false) }
  }, [query, categorySlug, shopSlug, sortBy, page, minPrice, maxPrice])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { productsApi.getCategories().then(res => setCategories(res.data)).catch(() => {}) }, [])
  useEffect(() => {
    if (!user) return
    listsApi.getAll().then(res => {
      const lists = res.data as BabyList[]
      setUserLists(lists)
      const ids = new Set<string>()
      lists.forEach(l => l.items?.forEach(i => ids.add(i.productId)))
      setListProductIds(ids)
    }).catch(() => {})
  }, [user])

  const handleAddToList = async (listId: string, priority: string) => {
    if (!selectedProduct) return
    try {
      await listsApi.addItem(listId, selectedProduct.id, priority)
      setListProductIds(prev => new Set([...prev, selectedProduct.id]))
      setSelectedProduct(null)
      showToast(`Dodano na listu! 💕`)
    } catch (err: any) {
      if (err.response?.status === 409) showToast('Već je na listi!')
      else showToast('Greška. Pokušaj ponovo.')
      setSelectedProduct(null)
    }
  }

  const handleProductClick = (product: Product) => {
    if (!user) { router.push('/prijava'); return }
    setSelectedProduct(product)
  }

  const setPreset = (min: string, max: string) => {
    setMinPrice(min); setMaxPrice(max); setPage(1)
  }

  const isPresetActive = (min: string, max: string) => minPrice === min && maxPrice === max

  const filterSidebar = (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-3">Kategorija</h3>
        <div className="space-y-0.5">
          <button onClick={() => { setCategorySlug(''); setPage(1) }}
            className={clsx('w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
              !categorySlug ? 'bg-blush/50 text-rose font-medium' : 'text-warm-gray hover:bg-cream')}>
            Sve kategorije
          </button>
          {categories.map(cat => (
            <div key={cat.id}>
              <div className="flex items-center">
                <button onClick={() => { setCategorySlug(cat.slug); setPage(1) }}
                  className={clsx('flex-1 text-left px-3 py-2 rounded-xl text-sm transition-colors',
                    categorySlug === cat.slug ? 'bg-blush/50 text-rose font-medium' : 'text-charcoal hover:bg-cream')}>
                  {cat.name}
                  <span className={clsx('ml-1.5 text-xs', categorySlug === cat.slug ? 'text-rose/60' : 'text-warm-gray/50')}>
                    ({(cat as any).totalCount ?? cat._count?.products ?? 0})
                  </span>
                </button>
                {cat.children && cat.children.length > 0 && (
                  <button onClick={() => setExpandedCats(prev => { const n = new Set(prev); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n })}
                    className="p-1 text-warm-gray hover:text-charcoal">
                    {expandedCats.has(cat.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </div>
              {expandedCats.has(cat.id) && cat.children?.map(sub => (
                <button key={sub.id} onClick={() => { setCategorySlug(sub.slug); setPage(1) }}
                  className={clsx('w-full text-left pl-7 pr-3 py-1.5 rounded-xl text-xs transition-colors',
                    categorySlug === sub.slug ? 'text-rose font-medium' : 'text-warm-gray hover:text-charcoal')}>
                  {sub.name} ({sub._count?.products ?? 0})
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-3">Cijena</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRICE_PRESETS.map(p => (
            <button key={p.label} onClick={() => isPresetActive(p.min, p.max) ? setPreset('', '') : setPreset(p.min, p.max)}
              className={clsx('px-2.5 py-1 rounded-full text-xs transition-colors border',
                isPresetActive(p.min, p.max) ? 'bg-rose text-white border-rose' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-warm-gray mb-1 block">Od (€)</label>
            <input type="number" placeholder="0" value={minPrice}
              onChange={e => { setMinPrice(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 bg-white border border-blush/40 rounded-lg text-sm focus:outline-none focus:border-rose" />
          </div>
          <div>
            <label className="text-xs text-warm-gray mb-1 block">Do (€)</label>
            <input type="number" placeholder="∞" value={maxPrice}
              onChange={e => { setMaxPrice(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 bg-white border border-blush/40 rounded-lg text-sm focus:outline-none focus:border-rose" />
          </div>
        </div>
        {(minPrice || maxPrice) && (
          <button onClick={() => { setMinPrice(''); setMaxPrice(''); setPage(1) }} className="text-xs text-rose hover:underline mt-2 block">
            Ukloni filter cijene
          </button>
        )}
      </div>

      <div>
        <h3 className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-3">Dućan</h3>
        <div className="space-y-0.5">
          <button onClick={() => { setShopSlug(''); setPage(1) }}
            className={clsx('w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
              !shopSlug ? 'bg-blush/50 text-rose font-medium' : 'text-warm-gray hover:bg-cream')}>
            Svi dućani
          </button>
          {[
            { slug: 'babycenter', name: 'Baby Center' },
            { slug: 'svijetbeba', name: 'Svijet Beba' },
          ].map(shop => (
            <button key={shop.slug} onClick={() => { setShopSlug(shopSlug === shop.slug ? '' : shop.slug); setPage(1) }}
              className={clsx('w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
                shopSlug === shop.slug ? 'bg-blush/50 text-rose font-medium' : 'text-charcoal hover:bg-cream')}>
              {shop.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="py-6">
            <h1 className="font-serif text-3xl text-charcoal mb-5">Katalog proizvoda</h1>
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-56">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray" />
                <input type="text" placeholder="Pretraži proizvode..." value={query}
                  onChange={e => { setQuery(e.target.value); setPage(1) }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-blush/40 rounded-full text-sm focus:outline-none focus:border-rose transition-colors" />
                {query && <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2"><X size={14} className="text-warm-gray" /></button>}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white border border-blush/40 rounded-full text-sm text-charcoal focus:outline-none appearance-none cursor-pointer">
                <option value="name">Po nazivu</option>
                <option value="price_asc">Cijena ↑</option>
                <option value="price_desc">Cijena ↓</option>
                <option value="newest">Najnovije</option>
              </select>
              <button className="sm:hidden flex items-center gap-2 px-4 py-3 bg-white border border-blush/40 rounded-full text-sm text-charcoal"
                onClick={() => setFiltersOpen(!filtersOpen)}>
                <SlidersHorizontal size={16} /> Filteri
              </button>
            </div>
          </div>

          <div className="flex gap-8">
            <aside className="hidden sm:block w-60 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pb-4">
              {filterSidebar}
            </aside>

            {filtersOpen && (
              <div className="sm:hidden fixed inset-0 z-40 bg-charcoal/20" onClick={() => setFiltersOpen(false)}>
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif text-lg mb-4">Filteri</h3>
                  {filterSidebar}
                  <button onClick={() => setFiltersOpen(false)} className="mt-4 w-full py-3 bg-charcoal text-white rounded-full text-sm font-medium">Primijeni</button>
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden border border-blush/30">
                      <div className="aspect-square shimmer" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 shimmer rounded-full w-3/4" />
                        <div className="h-3 shimmer rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-5xl block mb-4">🔍</span>
                  <h3 className="font-serif text-xl text-charcoal mb-2">Nema rezultata</h3>
                  <p className="text-warm-gray text-sm mb-4">Pokušaj s drugačijim filterima</p>
                  <button onClick={() => { setQuery(''); setCategorySlug(''); setShopSlug(''); setMinPrice(''); setMaxPrice(''); setPage(1) }}
                    className="px-5 py-2 bg-blush/40 text-charcoal rounded-full text-sm hover:bg-blush transition-colors">
                    Resetiraj filtere
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-warm-gray mb-4">
                    {pagination.total.toLocaleString('hr-HR')} proizvoda
                    {query && <> za "<strong>{query}</strong>"</>}
                    {(minPrice || maxPrice) && <> · {minPrice || '0'}€ – {maxPrice || '∞'}€</>}
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product}
                        onAddToList={handleProductClick}
                        isOnList={listProductIds.has(product.id)} />
                    ))}
                  </div>
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-10">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-2 rounded-full border border-blush/40 disabled:opacity-40 hover:bg-blush/20 transition-colors">
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-sm text-warm-gray px-4">Str. {page} od {pagination.totalPages}</span>
                      <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                        className="p-2 rounded-full border border-blush/40 disabled:opacity-40 hover:bg-blush/20 transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedProduct && (
        <AddToListModal product={selectedProduct} lists={userLists}
          onClose={() => setSelectedProduct(null)} onAdd={handleAddToList} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-charcoal text-white text-sm rounded-full shadow-2xl fade-in">{toast}</div>
      )}
    </>
  )
}
