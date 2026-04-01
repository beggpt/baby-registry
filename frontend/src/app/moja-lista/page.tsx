'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import { listsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { BabyList, ListItem, Priority } from '@/types'
import {
  Plus, Share2, Trash2, Link2, Edit3, Heart,
  ShoppingBag, Check, X, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'
import clsx from 'clsx'

const PRIORITY_CONFIG = {
  HIGH:   { label: '❤️ Jako želim',    cls: 'priority-HIGH' },
  MEDIUM: { label: '🌿 Bilo bi lijepo', cls: 'priority-MEDIUM' },
  LOW:    { label: '✨ Luksuz',         cls: 'priority-LOW' },
}

function ListItemRow({ item, listId, onDelete, onPriorityChange }: {
  item: ListItem
  listId: string
  onDelete: (itemId: string) => void
  onPriorityChange: (itemId: string, priority: Priority) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const { product, reservation } = item

  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await listsApi.removeItem(listId, item.id)
      onDelete(item.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className={clsx(
      'flex gap-4 p-4 bg-white rounded-2xl border transition-all',
      reservation ? 'border-gold/40 bg-gold/5' : 'border-blush/30',
      deleting && 'opacity-50 pointer-events-none'
    )}>
      {/* Slika */}
      <div className="w-16 h-16 flex-shrink-0 bg-cream rounded-xl overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl opacity-20">🍼</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-charcoal line-clamp-1">{product.name}</p>
            <p className="text-xs text-warm-gray mt-0.5">{product.shopName}</p>
          </div>
          <p className="text-sm font-medium text-rose flex-shrink-0">{formattedPrice}</p>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Prioritet selector */}
          <select
            value={item.priority}
            onChange={e => onPriorityChange(item.id, e.target.value as Priority)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none font-medium',
              PRIORITY_CONFIG[item.priority].cls
            )}
          >
            {Object.entries(PRIORITY_CONFIG).map(([val, conf]) => (
              <option key={val} value={val}>{conf.label}</option>
            ))}
          </select>

          {/* Status rezervacije */}
          {reservation ? (
            <span className="text-xs px-2.5 py-1 bg-gold/20 text-gold rounded-full font-medium">
              🎁 Rezervirao: {reservation.reservedBy}
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 status-available rounded-full">
              ✓ Slobodno
            </span>
          )}
        </div>
      </div>

      {/* Akcije */}
      <div className="flex flex-col gap-2 items-end flex-shrink-0">
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-warm-gray hover:text-sage transition-colors"
          title="Pogledaj u shopu"
        >
          <ExternalLink size={14} />
        </a>
        <button
          onClick={handleDelete}
          className="p-1.5 text-warm-gray hover:text-rose transition-colors"
          title="Ukloni s liste"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function NewListModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string, description: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name.trim(), desc.trim())
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl fade-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl">Nova lista</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-full transition-colors">
            <X size={18} className="text-warm-gray" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
              Naziv liste *
            </label>
            <input
              type="text"
              placeholder='npr. "Lista za Mateja"'
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
              Opis (opcionalno)
            </label>
            <textarea
              placeholder="Kratki opis ili poruka prijateljima..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          className="w-full mt-6 py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Kreiram...' : 'Kreiraj listu'}
        </button>
      </div>
    </div>
  )
}

export default function MojaListaPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, loadFromStorage } = useAuthStore()
  const [lists, setLists] = useState<BabyList[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedList, setExpandedList] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/prijava')
      return
    }
    if (user) {
      listsApi.getAll().then(res => {
        setLists(res.data)
        if (res.data.length > 0) setExpandedList(res.data[0].id)
      }).finally(() => setLoading(false))
    }
  }, [user, authLoading])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreateList = async (name: string, description: string) => {
    const res = await listsApi.create({ name, description })
    const newList = { ...res.data, items: [], _count: { items: 0 } }
    setLists(prev => [newList, ...prev])
    setExpandedList(newList.id)
    showToast('Lista kreirana! 🎉')
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Obrisati ovu listu? Sve stavke bit će izgubljene.')) return
    await listsApi.delete(listId)
    setLists(prev => prev.filter(l => l.id !== listId))
    showToast('Lista obrisana.')
  }

  const handleDeleteItem = (listId: string, itemId: string) => {
    setLists(prev => prev.map(l =>
      l.id === listId
        ? { ...l, items: l.items.filter(i => i.id !== itemId), _count: { items: (l._count?.items || 1) - 1 } }
        : l
    ))
  }

  const handlePriorityChange = async (listId: string, itemId: string, priority: Priority) => {
    await listsApi.updateItem(listId, itemId, { priority })
    setLists(prev => prev.map(l =>
      l.id === listId
        ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, priority } : i) }
        : l
    ))
  }

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/lista/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
    showToast('Link kopiran u međuspremnik! 🔗')
  }

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl animate-bounce block mb-4">🍼</span>
            <p className="text-warm-gray">Učitavanjem...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="py-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-charcoal">
                Hej, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-warm-gray mt-1">
                {lists.length === 0
                  ? 'Kreiraj svoju prvu baby listu'
                  : `Imaš ${lists.length} ${lists.length === 1 ? 'listu' : lists.length < 5 ? 'liste' : 'listi'}`
                }
              </p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-full hover:bg-rose/90 transition-colors flex-shrink-0"
            >
              <Plus size={16} />
              Nova lista
            </button>
          </div>

          {/* Empty state */}
          {lists.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-blush/30">
              <span className="text-6xl block mb-4">💝</span>
              <h3 className="font-serif text-2xl text-charcoal mb-3">Tvoja prva lista te čeka</h3>
              <p className="text-warm-gray mb-8 max-w-sm mx-auto text-sm">
                Kreiraj listu, dodaj proizvode iz kataloga i podijeli je s obitelji i prijateljima
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-6 py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors"
              >
                Kreiraj listu
              </button>
            </div>
          )}

          {/* Liste */}
          <div className="space-y-4">
            {lists.map(list => {
              const isExpanded = expandedList === list.id
              const reservedCount = list.items?.filter(i => i.reservation).length || 0
              const totalCount = list._count?.items || list.items?.length || 0

              return (
                <div key={list.id} className="bg-white rounded-3xl border border-blush/30 overflow-hidden">
                  {/* List header */}
                  <div className="p-5 flex items-center gap-3">
                    <button
                      onClick={() => setExpandedList(isExpanded ? null : list.id)}
                      className="flex-1 text-left flex items-center gap-3 min-w-0"
                    >
                      <div className="w-10 h-10 bg-blush/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Heart size={16} className="text-rose" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-medium text-charcoal">{list.name}</h2>
                        <p className="text-xs text-warm-gray mt-0.5">
                          {totalCount} stavki · {reservedCount} rezervirano
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Share */}
                      <button
                        onClick={() => copyShareLink(list.shareSlug)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sage bg-sage-light/50 rounded-full hover:bg-sage-light transition-colors"
                        title="Kopiraj link za dijeljenje"
                      >
                        {copiedSlug === list.shareSlug ? <Check size={12} /> : <Link2 size={12} />}
                        {copiedSlug === list.shareSlug ? 'Kopirano!' : 'Dijeli'}
                      </button>

                      {/* Delete list */}
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="p-1.5 text-warm-gray hover:text-rose transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedList(isExpanded ? null : list.id)}
                        className="p-1.5 text-warm-gray"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Lista stavki */}
                  {isExpanded && (
                    <div className="border-t border-blush/20 p-4 space-y-3">
                      {list.items?.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-warm-gray text-sm mb-3">Lista je prazna</p>
                          <a
                            href="/katalog"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blush/40 text-charcoal text-sm rounded-full hover:bg-blush transition-colors"
                          >
                            <ShoppingBag size={14} />
                            Dodaj proizvode iz kataloga
                          </a>
                        </div>
                      ) : (
                        <>
                          {list.items.map(item => (
                            <ListItemRow
                              key={item.id}
                              item={item}
                              listId={list.id}
                              onDelete={(itemId) => handleDeleteItem(list.id, itemId)}
                              onPriorityChange={(itemId, priority) => handlePriorityChange(list.id, itemId, priority)}
                            />
                          ))}

                          <a
                            href="/katalog"
                            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-blush/40 rounded-2xl text-sm text-warm-gray hover:border-blush-mid hover:text-charcoal transition-colors mt-2"
                          >
                            <Plus size={14} />
                            Dodaj još proizvoda
                          </a>
                        </>
                      )}

                      {/* Share link footer */}
                      <div className="pt-3 border-t border-blush/20 flex items-center justify-between">
                        <div className="text-xs text-warm-gray">
                          Link za dijeljenje:
                          <span className="ml-1 text-charcoal font-medium">
                            /lista/{list.shareSlug.substring(0, 8)}...
                          </span>
                        </div>
                        <a
                          href={`/lista/${list.shareSlug}`}
                          target="_blank"
                          className="flex items-center gap-1 text-xs text-sage hover:text-sage/80 transition-colors"
                        >
                          Pregled <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {showNewModal && (
        <NewListModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateList}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-charcoal text-white text-sm rounded-full shadow-2xl fade-in">
          {toast}
        </div>
      )}
    </>
  )
}
