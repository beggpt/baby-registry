'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { listsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { BabyList, ListItem, Priority } from '@/types'
import { Plus, Link2, Trash2, Heart, ExternalLink, Check, X, ChevronDown, ChevronUp, ShoppingBag, Calendar } from 'lucide-react'
import clsx from 'clsx'

const PRIORITY_CONFIG = {
  HIGH:   { label: '❤️ Jako želim',    cls: 'priority-HIGH' },
  MEDIUM: { label: '🌿 Bilo bi lijepo', cls: 'priority-MEDIUM' },
  LOW:    { label: '✨ Luksuz',         cls: 'priority-LOW' },
}

const OCCASIONS = [
  { value: 'birth',    emoji: '🍼', label: 'Rođenje djeteta', dateLabel: 'Planirani termin poroda' },
  { value: 'birthday', emoji: '🎂', label: 'Dječji rođendan',  dateLabel: 'Datum rođendana' },
]

function parseDMY(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  return isNaN(d.getTime()) ? null : d
}

function toDateInput(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function ListItemRow({ item, listId, onDelete, onPriorityChange }: {
  item: ListItem; listId: string
  onDelete: (id: string) => void
  onPriorityChange: (id: string, p: Priority) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const { product, reservation } = item
  const price = new Intl.NumberFormat('hr-HR', { style: 'currency', currency: product.currency || 'EUR' }).format(product.price)

  const handleDelete = async () => {
    setDeleting(true)
    try { await listsApi.removeItem(listId, item.id); onDelete(item.id) }
    catch { setDeleting(false) }
  }

  return (
    <div className={clsx('flex gap-3 p-3 bg-white rounded-2xl border transition-all',
      reservation ? 'border-gold/40 bg-gold/5' : 'border-blush/30',
      deleting && 'opacity-40 pointer-events-none')}>
      <div className="w-14 h-14 flex-shrink-0 bg-cream rounded-xl overflow-hidden">
        {product.imageUrl
          ? <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
          : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">🍼</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal line-clamp-1">{product.name}</p>
        <p className="text-xs text-warm-gray mt-0.5">{product.shopName}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-sm font-medium text-rose">{price}</span>
          <select value={item.priority} onChange={e => onPriorityChange(item.id, e.target.value as Priority)}
            className={clsx('text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none font-medium', PRIORITY_CONFIG[item.priority].cls)}>
            {Object.entries(PRIORITY_CONFIG).map(([val, conf]) => (
              <option key={val} value={val}>{conf.label}</option>
            ))}
          </select>
          {reservation
            ? <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full font-medium">🎁 {reservation.reservedBy}</span>
            : <span className="text-xs px-2 py-0.5 status-available rounded-full">✓ Slobodno</span>
          }
        </div>
      </div>
      <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
        <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-warm-gray hover:text-sage transition-colors">
          <ExternalLink size={13} />
        </a>
        <button onClick={handleDelete} className="p-1.5 text-warm-gray hover:text-rose transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function NewListModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string, occasion: string, dateInput: string, babyGender: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [occasion, setOccasion] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [babyGender, setBabyGender] = useState('')
  const [loading, setLoading] = useState(false)
  const [dateError, setDateError] = useState('')

  const selectedOcc = OCCASIONS.find(o => o.value === occasion)

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, '')
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2)
    if (val.length >= 6) val = val.slice(0, 5) + '/' + val.slice(5)
    val = val.slice(0, 10)
    setDateInput(val)
    if (val.length === 10 && !parseDMY(val)) setDateError('Datum nije ispravan')
    else setDateError('')
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    if (occasion && dateInput) {
      if (!parseDMY(dateInput)) { setDateError('Datum nije ispravan. Format: dd/mm/yyyy'); return }
    }
    setLoading(true)
    await onCreate(name.trim(), occasion, dateInput, babyGender)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-serif text-xl">Nova lista</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-full transition-colors"><X size={18} className="text-warm-gray" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Naziv liste *</label>
            <input type="text" placeholder='npr. "Lista za Mateja"' value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose" autoFocus />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Za što je lista?</label>
            <div className="grid grid-cols-2 gap-2">
              {OCCASIONS.map(o => (
                <button key={o.value} type="button"
                  onClick={() => { setOccasion(oc => oc === o.value ? '' : o.value); setDateInput('') }}
                  className={clsx('flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium border transition-all',
                    occasion === o.value ? 'border-rose bg-blush/30 text-charcoal' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}>
                  <span className="text-xl">{o.emoji}</span> {o.label}
                </button>
              ))}
            </div>
          </div>

          {selectedOcc && (
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                <Calendar size={11} className="inline mr-1" />
                {selectedOcc.dateLabel}
              </label>
              <div className="relative">
                <input type="text" placeholder="15/06/2025" value={dateInput} onChange={handleDateInput} maxLength={10}
                  className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose font-mono tracking-wider" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-warm-gray/50">dd/mm/yyyy</span>
              </div>
              {dateError && <p className="text-xs text-rose mt-1">{dateError}</p>}
              {dateInput.length === 10 && parseDMY(dateInput) && (
                <p className="text-xs text-sage mt-1">✓ {parseDMY(dateInput)?.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
            </div>
          )}

          {occasion === 'birth' && (
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Spol bebe</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ value: 'boy', emoji: '💙', label: 'Dječak' }, { value: 'girl', emoji: '💗', label: 'Djevojčica' }, { value: 'surprise', emoji: '🎀', label: 'Iznenađenje' }].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setBabyGender(g => g === opt.value ? '' : opt.value)}
                    className={clsx('flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border transition-all',
                      babyGender === opt.value ? 'border-rose bg-blush/30' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}>
                    <span className="text-lg">{opt.emoji}</span> {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={!name.trim() || loading || (!!dateInput && dateInput.length === 10 && !parseDMY(dateInput))}
          className="w-full mt-5 py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors disabled:opacity-50">
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

  useEffect(() => { loadFromStorage() }, [])
  useEffect(() => {
    if (!authLoading && !user) { router.push('/prijava'); return }
    if (user) {
      listsApi.getAll()
        .then(res => { setLists(res.data); if (res.data.length > 0) setExpandedList(res.data[0].id) })
        .finally(() => setLoading(false))
    }
  }, [user, authLoading])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleCreate = async (name: string, occasion: string, dateInput: string, babyGender: string) => {
    let dueDate: string | undefined
    if (dateInput && occasion) {
      const parsed = parseDMY(dateInput)
      if (parsed) dueDate = parsed.toISOString()
    }

    // Ažuriraj profil korisnika s datumom i prigodi
    if (dueDate || babyGender) {
      try {
        const { authApi } = await import('@/lib/api')
        await authApi.updateProfile({ dueDate, babyGender: babyGender || undefined })
      } catch {}
    }

    const res = await listsApi.create({ name, occasion: occasion as any || undefined })
    const newList = { ...res.data, items: [], _count: { items: 0 } }
    setLists(prev => [newList, ...prev])
    setExpandedList(newList.id)
    showToast('Lista kreirana! 🎉')
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Obrisati ovu listu?')) return
    await listsApi.delete(listId)
    setLists(prev => prev.filter(l => l.id !== listId))
    showToast('Lista obrisana.')
  }

  const handleDeleteItem = (listId: string, itemId: string) => {
    setLists(prev => prev.map(l => l.id === listId
      ? { ...l, items: l.items.filter(i => i.id !== itemId), _count: { items: (l._count?.items || 1) - 1 } }
      : l
    ))
  }

  const handlePriorityChange = async (listId: string, itemId: string, priority: Priority) => {
    await listsApi.updateItem(listId, itemId, { priority })
    setLists(prev => prev.map(l => l.id === listId
      ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, priority } : i) }
      : l
    ))
  }

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/lista/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
    showToast('Link kopiran! 🔗')
  }

  const getOccLabel = (occ?: string | null) => OCCASIONS.find(o => o.value === occ)

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center"><span className="text-4xl animate-bounce block mb-4">🍼</span><p className="text-warm-gray">Učitavanje...</p></div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="py-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-charcoal">Hej, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-warm-gray mt-1">{lists.length === 0 ? 'Kreiraj svoju prvu listu' : `Imaš ${lists.length} ${lists.length === 1 ? 'listu' : 'liste'}`}</p>
            </div>
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-full hover:bg-rose/90 transition-colors flex-shrink-0">
              <Plus size={16} /> Nova lista
            </button>
          </div>

          {lists.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-blush/30">
              <span className="text-6xl block mb-4">💝</span>
              <h3 className="font-serif text-2xl text-charcoal mb-3">Tvoja prva lista te čeka</h3>
              <p className="text-warm-gray mb-8 max-w-sm mx-auto text-sm">Kreiraj listu, dodaj proizvode iz kataloga i podijeli je s obitelji i prijateljima</p>
              <button onClick={() => setShowNewModal(true)} className="px-6 py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors">Kreiraj listu</button>
            </div>
          )}

          <div className="space-y-4">
            {lists.map(list => {
              const isExpanded = expandedList === list.id
              const reservedCount = list.items?.filter(i => i.reservation).length || 0
              const totalCount = list._count?.items || list.items?.length || 0
              const occ = getOccLabel(list.occasion)

              return (
                <div key={list.id} className="bg-white rounded-3xl border border-blush/30 overflow-hidden">
                  <div className="p-5 flex items-center gap-3">
                    <button onClick={() => setExpandedList(isExpanded ? null : list.id)} className="flex-1 text-left flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blush/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{occ ? occ.emoji : '💝'}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-medium text-charcoal">{list.name}</h2>
                          {occ && <span className="text-xs px-2 py-0.5 bg-blush/40 text-rose rounded-full">{occ.label}</span>}
                        </div>
                        <p className="text-xs text-warm-gray mt-0.5">{totalCount} stavki · {reservedCount} rezervirano</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => copyShareLink(list.shareSlug)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sage bg-sage-light/50 rounded-full hover:bg-sage-light transition-colors">
                        {copiedSlug === list.shareSlug ? <Check size={12} /> : <Link2 size={12} />}
                        {copiedSlug === list.shareSlug ? 'Kopirano!' : 'Dijeli'}
                      </button>
                      <button onClick={() => handleDeleteList(list.id)} className="p-1.5 text-warm-gray hover:text-rose transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <button onClick={() => setExpandedList(isExpanded ? null : list.id)} className="p-1.5 text-warm-gray">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-blush/20 p-4 space-y-3">
                      {list.items?.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-warm-gray text-sm mb-3">Lista je prazna</p>
                          <a href="/katalog" className="inline-flex items-center gap-2 px-4 py-2 bg-blush/40 text-charcoal text-sm rounded-full hover:bg-blush transition-colors">
                            <ShoppingBag size={14} /> Dodaj iz kataloga
                          </a>
                        </div>
                      ) : (
                        <>
                          {list.items.map(item => (
                            <ListItemRow key={item.id} item={item} listId={list.id}
                              onDelete={id => handleDeleteItem(list.id, id)}
                              onPriorityChange={(id, p) => handlePriorityChange(list.id, id, p)} />
                          ))}
                          <a href="/katalog" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-blush/40 rounded-2xl text-sm text-warm-gray hover:border-blush-mid hover:text-charcoal transition-colors mt-2">
                            <Plus size={14} /> Dodaj još proizvoda
                          </a>
                        </>
                      )}
                      <div className="pt-3 border-t border-blush/20 flex items-center justify-between">
                        <p className="text-xs text-warm-gray font-mono">/lista/{list.shareSlug.substring(0, 10)}...</p>
                        <a href={`/lista/${list.shareSlug}`} target="_blank" className="flex items-center gap-1 text-xs text-sage hover:underline">
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

      {showNewModal && <NewListModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-charcoal text-white text-sm rounded-full shadow-2xl fade-in">{toast}</div>
      )}
    </>
  )
}
