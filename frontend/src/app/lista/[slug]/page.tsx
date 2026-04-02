'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { publicApi } from '@/lib/api'
import { BabyList, ListItem } from '@/types'
import { ExternalLink, Heart, Gift, X, Check, User, MessageSquare } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { hr } from 'date-fns/locale'
import clsx from 'clsx'

// Modal za rezervaciju - korak po korak unos imena
function ReserveModal({
  item,
  onClose,
  onReserve,
}: {
  item: ListItem
  onClose: () => void
  onReserve: (itemId: string, name: string, note?: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')

  const { product } = item

  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await onReserve(item.id, name.trim(), note.trim() || undefined)
      setStep('success')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-up">
        {step === 'form' ? (
          <>
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <h3 className="font-serif text-xl text-charcoal">Rezerviraj poklon</h3>
                <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-full transition-colors">
                  <X size={18} className="text-warm-gray" />
                </button>
              </div>

              {/* Proizvod preview */}
              <div className="flex gap-3 p-3 bg-cream rounded-2xl mb-5">
                <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                    : <span className="text-2xl">🍼</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal line-clamp-2 leading-snug">{product.name}</p>
                  <p className="text-sm text-rose font-medium mt-0.5">{formattedPrice}</p>
                  <p className="text-xs text-warm-gray">{product.shopName}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Ime */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                    <User size={11} />
                    Tvoje ime *
                  </label>
                  <input
                    type="text"
                    placeholder='npr. "Teta Ana" ili "Obitelj Kovač"'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
                    autoFocus
                  />
                  <p className="text-xs text-warm-gray/60 mt-1.5">
                    Mama će vidjeti tko je rezervirao ovaj poklon
                  </p>
                </div>

                {/* Poruka (opcionalno) */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                    <MessageSquare size={11} />
                    Poruka za mamu (opcionalno)
                  </label>
                  <textarea
                    placeholder="Čestitke! Jedva čekamo upoznati malu princezu 🎀"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid resize-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-blush/40 text-warm-gray text-sm font-medium rounded-full hover:bg-cream transition-colors"
              >
                Odustani
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || loading}
                className="flex-1 py-3 bg-rose text-white text-sm font-medium rounded-full hover:bg-rose/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Rezerviram...' : '🎁 Rezerviraj'}
              </button>
            </div>
          </>
        ) : (
          /* Uspjeh */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-sage-light/60 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-sage" />
            </div>
            <h3 className="font-serif text-2xl text-charcoal mb-2">Rezervirano!</h3>
            <p className="text-warm-gray text-sm mb-1">
              Hvala, <strong>{name}</strong>! 💕
            </p>
            <p className="text-warm-gray text-sm mb-6">
              Mama će znati da ti kupiš <em>{product.name}</em>.
              Kupi ga direktno na stranici shopa.
            </p>
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-full text-sm font-medium hover:bg-sage/90 transition-colors"
            >
              <ExternalLink size={14} />
              Idi na {product.shopName}
            </a>
            <button
              onClick={onClose}
              className="block mx-auto mt-3 text-xs text-warm-gray hover:text-charcoal transition-colors"
            >
              Zatvori
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Jedna stavka na javnoj listi
function PublicListItem({ item, onReserve }: {
  item: ListItem
  onReserve: (item: ListItem) => void
}) {
  const { product, reservation, priority } = item
  const isReserved = !!reservation

  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price)

  const priorityLabel = {
    HIGH: '❤️ Jako želi',
    MEDIUM: '🌿 Bilo bi lijepo',
    LOW: '✨ Luksuz',
  }[priority]

  return (
    <div className={clsx(
      'bg-white rounded-2xl border p-4 flex gap-4 transition-all',
      isReserved ? 'border-gold/30 opacity-75' : 'border-blush/30 hover:border-blush-mid hover:shadow-sm'
    )}>
      {/* Slika */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-cream rounded-xl overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-20">🍼</span>
          </div>
        )}
        {isReserved && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal line-clamp-2 leading-snug">{product.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm font-medium text-rose">{formattedPrice}</span>
          <span className="text-xs text-warm-gray/50">·</span>
          <span className="text-xs text-warm-gray">{product.shopName}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            { HIGH: 'priority-HIGH', MEDIUM: 'priority-MEDIUM', LOW: 'priority-LOW' }[priority]
          )}>
            {priorityLabel}
          </span>

          {isReserved ? (
            <span className="text-xs px-2 py-0.5 bg-gold/15 text-gold rounded-full font-medium">
              🎁 Rezervirala: {reservation!.reservedBy}
            </span>
          ) : null}
        </div>
      </div>

      {/* Akcije */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {isReserved ? (
          <span className="text-xs text-warm-gray text-right">Rezervirano</span>
        ) : (
          <button
            onClick={() => onReserve(item)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose text-white text-xs font-medium rounded-xl hover:bg-rose/90 transition-colors whitespace-nowrap"
          >
            <Gift size={12} />
            Kupit ću ovo
          </button>
        )}
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-warm-gray hover:text-sage transition-colors justify-end"
        >
          <ExternalLink size={11} />
          Shop
        </a>
      </div>
    </div>
  )
}

export default function PublicListPage() {
  const { slug } = useParams() as { slug: string }
  const [list, setList] = useState<BabyList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reserveItem, setReserveItem] = useState<ListItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved'>('all')

  useEffect(() => {
    publicApi.getList(slug)
      .then(res => setList(res.data))
      .catch(err => {
        setError(err.response?.data?.error || 'Lista nije pronađena')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const handleReserve = async (itemId: string, name: string, note?: string) => {
    await publicApi.reserve(slug, itemId, name, note)
    // Ažuriraj lokalni state
    setList(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(i =>
          i.id === itemId
            ? { ...i, reservation: { id: 'temp', listItemId: itemId, reservedBy: name, reservedAt: new Date().toISOString(), status: 'RESERVED', note } }
            : i
        )
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl animate-bounce block mb-4">🍼</span>
          <p className="text-warm-gray">Učitavanje liste...</p>
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center">
          <span className="text-5xl block mb-4">😔</span>
          <h1 className="font-serif text-2xl text-charcoal mb-2">Lista nije pronađena</h1>
          <p className="text-warm-gray text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const mama = list.user!
  const daysUntilDue = mama.dueDate
    ? differenceInDays(new Date(mama.dueDate), new Date())
    : null

  const filteredItems = list.items.filter(i => {
    if (filter === 'available') return !i.reservation
    if (filter === 'reserved') return !!i.reservation
    return true
  })

  const totalItems = list.items.length
  const reservedItems = list.items.filter(i => i.reservation).length
  const availableItems = totalItems - reservedItems

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-64 bg-blush/50 rounded-full blur-3xl translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-48 bg-sage-light/40 rounded-full blur-3xl -translate-x-1/4" />
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-12 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-warm-gray text-xs mb-5 border border-blush/30">
            <Heart size={11} className="text-rose" />
            Baby lista
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-3">
            {list.name}
          </h1>

          <p className="text-warm-gray mb-2">
            Lista za bebu <strong>{mama.name}</strong>
          </p>

          {/* Info o bebi */}
          <div className="flex items-center justify-center gap-4 flex-wrap mt-4">
            {mama.dueDate && (
              <span className="flex items-center gap-1.5 text-sm text-warm-gray bg-white/70 px-3 py-1.5 rounded-full border border-blush/30">
                🗓️ Termin: {format(new Date(mama.dueDate), 'd. MMMM yyyy.', { locale: hr })}
                {daysUntilDue !== null && daysUntilDue > 0 && (
                  <span className="text-rose font-medium">({daysUntilDue} dana)</span>
                )}
              </span>
            )}
            {mama.babyGender && mama.babyGender !== 'surprise' && (
              <span className="flex items-center gap-1.5 text-sm text-warm-gray bg-white/70 px-3 py-1.5 rounded-full border border-blush/30">
                {mama.babyGender === 'boy' ? '💙 Dječak' : '💗 Djevojčica'}
              </span>
            )}
            {mama.babyGender === 'surprise' && (
              <span className="flex items-center gap-1.5 text-sm text-warm-gray bg-white/70 px-3 py-1.5 rounded-full border border-blush/30">
                🎀 Iznenađenje
              </span>
            )}
          </div>

          {list.description && (
            <p className="mt-4 text-warm-gray text-sm italic max-w-md mx-auto">{list.description}</p>
          )}

          {/* Statistike */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-serif text-charcoal">{totalItems}</p>
              <p className="text-xs text-warm-gray">ukupno</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-serif text-rose">{availableItems}</p>
              <p className="text-xs text-warm-gray">slobodno</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-serif text-gold">{reservedItems}</p>
              <p className="text-xs text-warm-gray">rezervirano</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Filteri */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'all', label: 'Sve' },
            { key: 'available', label: '✓ Slobodno' },
            { key: 'reserved', label: '🎁 Rezervirano' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                filter === f.key
                  ? 'bg-charcoal text-white'
                  : 'bg-white text-warm-gray border border-blush/40 hover:border-blush-mid'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stavke */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">
                {filter === 'reserved' ? '🎁' : '🔍'}
              </span>
              <p className="text-warm-gray text-sm">
                {filter === 'reserved' ? 'Još ništa nije rezervirano' : 'Nema slobodnih stavki'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <PublicListItem
                key={item.id}
                item={item}
                onReserve={() => setReserveItem(item)}
              />
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="mt-10 p-5 bg-white/60 rounded-2xl border border-blush/20 text-center">
          <p className="text-sm text-warm-gray">
            🎀 Ova lista je kreirana na{' '}
            <a href="/" className="text-rose hover:underline font-medium">Bebinoj Listi</a>
            . Kupuj direktno u shopu klikom na gumb "Shop" — ništa se ne plaća ovdje.
          </p>
        </div>
      </div>

      {/* Reserve modal */}
      {reserveItem && (
        <ReserveModal
          item={reserveItem}
          onClose={() => setReserveItem(null)}
          onReserve={handleReserve}
        />
      )}
    </div>
  )
}
