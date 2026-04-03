'use client'
import { useEffect, useState } from 'react'
import { publicApi } from '@/lib/api'
import { BabyList, ListItem, GroupContributor } from '@/types'
import { ExternalLink, Heart, Gift, X, Check, User, MessageSquare, Users } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { hr } from 'date-fns/locale'
import clsx from 'clsx'

// Choice modal - solo or group buy
function ReserveChoiceModal({
  item,
  onClose,
  onSolo,
  onGroup,
}: {
  item: ListItem
  onClose: () => void
  onSolo: () => void
  onGroup: () => void
}) {
  const { product } = item
  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-up">
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <h3 className="font-serif text-xl text-charcoal">Kako zelis kupiti?</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-full transition-colors">
              <X size={18} className="text-warm-gray" />
            </button>
          </div>

          {/* Product preview */}
          <div className="flex gap-3 p-3 bg-cream rounded-2xl mb-5">
            <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
              {product.imageUrl
                ? <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                : <span className="text-2xl">&#x1F37C;</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-charcoal line-clamp-2 leading-snug">{product.name}</p>
              <p className="text-sm text-rose font-medium mt-0.5">{formattedPrice}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onSolo}
              className="w-full p-4 border border-blush/40 rounded-2xl text-left hover:border-rose hover:bg-blush/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose/10 rounded-xl flex items-center justify-center">
                  <Gift size={18} className="text-rose" />
                </div>
                <div>
                  <p className="font-medium text-charcoal group-hover:text-rose transition-colors">Kupujem sam/a</p>
                  <p className="text-xs text-warm-gray mt-0.5">Rezerviraj cijeli poklon za sebe</p>
                </div>
              </div>
            </button>

            <button
              onClick={onGroup}
              className="w-full p-4 border border-blush/40 rounded-2xl text-left hover:border-sage hover:bg-sage-light/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage-light/60 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-sage" />
                </div>
                <div>
                  <p className="font-medium text-charcoal group-hover:text-sage transition-colors">Skupljamo zajedno &#x1F465;</p>
                  <p className="text-xs text-warm-gray mt-0.5">Vise osoba moze doprinijeti za ovaj poklon</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
                    : <span className="text-2xl">&#x1F37C;</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal line-clamp-2 leading-snug">{product.name}</p>
                  <p className="text-sm text-rose font-medium mt-0.5">{formattedPrice}</p>
                  <p className="text-xs text-warm-gray">{product.shopName}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                    <User size={11} />
                    Tvoje ime *
                  </label>
                  <input
                    type="text"
                    placeholder='npr. "Teta Ana" ili "Obitelj Kovac"'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
                    autoFocus
                  />
                  <p className="text-xs text-warm-gray/60 mt-1.5">
                    Mama ce vidjeti tko je rezervirao ovaj poklon
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                    <MessageSquare size={11} />
                    Poruka za mamu (opcionalno)
                  </label>
                  <textarea
                    placeholder="Cestitke! Jedva cekamo upoznati malu princezu"
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
                {loading ? 'Rezerviram...' : '&#x1F381; Rezerviraj'}
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-sage-light/60 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-sage" />
            </div>
            <h3 className="font-serif text-2xl text-charcoal mb-2">Rezervirano!</h3>
            <p className="text-warm-gray text-sm mb-1">
              Hvala, <strong>{name}</strong>!
            </p>
            <p className="text-warm-gray text-sm mb-6">
              Mama ce znati da ti kupis <em>{product.name}</em>.
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

// Group buy modal - create or join
function GroupBuyModal({
  item,
  slug,
  isJoin,
  onClose,
  onSuccess,
}: {
  item: ListItem
  slug: string
  isJoin: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'ORDERER' | 'CONTRIBUTOR'>('CONTRIBUTOR')
  const [amount, setAmount] = useState('')
  const [targetAmount, setTargetAmount] = useState(item.product.price.toString())
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [error, setError] = useState('')

  const { product } = item

  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price)

  const handleSubmit = async () => {
    if (!name.trim() || !amount) return
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) { setError('Unesi ispravan iznos'); return }

    setLoading(true)
    setError('')
    try {
      if (isJoin) {
        await publicApi.joinGroupBuy(slug, item.id, {
          name: name.trim(),
          role,
          amount: amountNum,
          note: note.trim() || undefined,
        })
      } else {
        const target = parseFloat(targetAmount)
        if (isNaN(target) || target <= 0) { setError('Unesi ispravan ciljni iznos'); setLoading(false); return }
        await publicApi.reserveGroupBuy(slug, item.id, {
          reservedBy: name.trim(),
          isGroupBuy: true,
          targetAmount: target,
          amount: amountNum,
          role,
          note: note.trim() || undefined,
        })
      }
      setStep('success')
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greska')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-up max-h-[90vh] overflow-y-auto">
        {step === 'form' ? (
          <>
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <h3 className="font-serif text-xl text-charcoal">
                  {isJoin ? 'Pridruzi se &#x1F465;' : 'Grupna kupovina &#x1F465;'}
                </h3>
                <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-full transition-colors">
                  <X size={18} className="text-warm-gray" />
                </button>
              </div>

              {/* Product preview */}
              <div className="flex gap-3 p-3 bg-cream rounded-2xl mb-5">
                <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                    : <span className="text-2xl">&#x1F37C;</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal line-clamp-2 leading-snug">{product.name}</p>
                  <p className="text-sm text-rose font-medium mt-0.5">{formattedPrice}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                    <User size={11} />
                    Tvoje ime *
                  </label>
                  <input
                    type="text"
                    placeholder='npr. "Teta Ana"'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
                    autoFocus
                  />
                </div>

                {/* Role selector */}
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide block">Tvoja uloga</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('ORDERER')}
                      className={clsx('p-3 rounded-xl border text-left transition-all text-sm',
                        role === 'ORDERER' ? 'border-rose bg-blush/20 text-charcoal' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}
                    >
                      <span className="text-lg block mb-1">&#x1F6D2;</span>
                      <span className="font-medium block text-xs">Ja narucujem i placam</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('CONTRIBUTOR')}
                      className={clsx('p-3 rounded-xl border text-left transition-all text-sm',
                        role === 'CONTRIBUTOR' ? 'border-sage bg-sage-light/30 text-charcoal' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}
                    >
                      <span className="text-lg block mb-1">&#x1F4B0;</span>
                      <span className="font-medium block text-xs">Dajem novce, neka netko drugi naruci</span>
                    </button>
                  </div>
                </div>

                {/* Target amount (only for creating new group buy) */}
                {!isJoin && (
                  <div>
                    <label className="text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide block">Ciljni iznos (EUR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={targetAmount}
                      onChange={e => setTargetAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
                    />
                    <p className="text-xs text-warm-gray/60 mt-1">Cijena proizvoda: {formattedPrice}</p>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide block">Tvoj doprinos (EUR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="npr. 50"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                    <MessageSquare size={11} />
                    Poruka (opcionalno)
                  </label>
                  <textarea
                    placeholder="Sretno s bebom!"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid resize-none transition-colors"
                  />
                </div>

                {error && <p className="text-sm text-rose">{error}</p>}
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 border border-blush/40 text-warm-gray text-sm font-medium rounded-full hover:bg-cream transition-colors">
                Odustani
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !amount || loading}
                className="flex-1 py-3 bg-sage text-white text-sm font-medium rounded-full hover:bg-sage/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saljem...' : isJoin ? '&#x1F465; Pridruzi se' : '&#x1F465; Pokreni skupljanje'}
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-sage-light/60 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-sage" />
            </div>
            <h3 className="font-serif text-2xl text-charcoal mb-2">
              {isJoin ? 'Pridruzio/la si se!' : 'Grupna kupovina pokrenuta!'}
            </h3>
            <p className="text-warm-gray text-sm mb-6">
              Hvala, <strong>{name}</strong>! Tvoj doprinos od <strong>{amount} EUR</strong> je zabiljeyen.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-charcoal text-white rounded-full text-sm font-medium hover:bg-charcoal/90 transition-colors"
            >
              Zatvori
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Group buy progress display on item
function GroupBuyInfo({ reservation }: { reservation: NonNullable<ListItem['reservation']> }) {
  const contributors = reservation.contributors || []
  const totalCollected = contributors.reduce((sum, c) => sum + c.amount, 0)
  const target = reservation.targetAmount || 0
  const progressPercent = target > 0 ? Math.min(100, Math.round((totalCollected / target) * 100)) : 0

  return (
    <div className="mt-2 p-3 bg-sage-light/20 rounded-xl border border-sage/10">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-warm-gray mb-1.5">
        <span>{totalCollected.toFixed(2)} / {target.toFixed(2)} EUR skupljeno ({contributors.length} osoba)</span>
        <span className="font-medium text-sage">{progressPercent}%</span>
      </div>
      <div className="h-2.5 bg-white/80 rounded-full border border-sage/20 overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPercent}%`,
            background: progressPercent >= 100
              ? 'linear-gradient(90deg, #8BA888, #6B9B68)'
              : 'linear-gradient(90deg, #C9A96E, #D4B87A)',
          }}
        />
      </div>
      {progressPercent >= 100 && (
        <p className="text-xs text-sage font-medium mb-2">&#x1F389; Cilj je dostignut!</p>
      )}

      {/* Contributors list */}
      <div className="space-y-1">
        {contributors.map((c: GroupContributor) => (
          <div key={c.id} className="flex items-center gap-2 text-xs">
            <span>{c.role === 'ORDERER' ? '&#x1F6D2;' : '&#x1F4B0;'}</span>
            <span className="font-medium text-charcoal">{c.name}</span>
            <span className="text-warm-gray">{c.amount.toFixed(2)} EUR</span>
            {c.note && <span className="text-warm-gray/60 italic truncate">- {c.note}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// Jedna stavka na javnoj listi
function PublicListItem({ item, onReserve, onGroupBuy, onJoinGroup }: {
  item: ListItem
  onReserve: (item: ListItem) => void
  onGroupBuy: (item: ListItem) => void
  onJoinGroup: (item: ListItem) => void
}) {
  const { product, reservation, priority } = item
  const isReserved = !!reservation
  const isGroupBuy = reservation?.isGroupBuy

  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price)

  const priorityLabel = {
    HIGH: '&#x2764;&#xFE0F; Jako zeli',
    MEDIUM: '&#x1F33F; Bilo bi lijepo',
    LOW: '&#x2728; Luksuz',
  }[priority]

  return (
    <div className={clsx(
      'bg-white rounded-2xl border p-4 flex gap-4 transition-all cursor-pointer',
      isReserved && !isGroupBuy ? 'border-gold/30 opacity-75' : isGroupBuy ? 'border-sage/30' : 'border-blush/30 hover:border-blush-mid hover:shadow-sm'
    )}
      onClick={() => window.open(product.productUrl, '_blank', 'noopener,noreferrer')}
    >
      {/* Slika */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-cream rounded-xl overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-20">&#x1F37C;</span>
          </div>
        )}
        {isReserved && !isGroupBuy && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          </div>
        )}
        {isGroupBuy && (
          <div className="absolute top-1 right-1 w-6 h-6 bg-sage rounded-full flex items-center justify-center">
            <Users size={11} className="text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal line-clamp-2 leading-snug">{product.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm font-medium text-rose">{formattedPrice}</span>
          <span className="text-xs text-warm-gray/50">&#xB7;</span>
          <span className="text-xs text-warm-gray">{product.shopName}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            { HIGH: 'priority-HIGH', MEDIUM: 'priority-MEDIUM', LOW: 'priority-LOW' }[priority]
          )} dangerouslySetInnerHTML={{ __html: priorityLabel }}>
          </span>

          {isReserved && !isGroupBuy ? (
            <span className="text-xs px-2 py-0.5 bg-gold/15 text-gold rounded-full font-medium">
              &#x1F381; Rezervirano od: {reservation!.reservedBy}
            </span>
          ) : isGroupBuy ? (
            <span className="text-xs px-2 py-0.5 bg-sage-light/60 text-sage rounded-full font-medium">
              &#x1F465; Grupna kupovina ({reservation!.contributors?.length || 0} osoba)
            </span>
          ) : null}
        </div>

        {/* Group buy info */}
        {isGroupBuy && reservation && <GroupBuyInfo reservation={reservation} />}
      </div>

      {/* Akcije */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {isReserved && !isGroupBuy ? (
          <span className="text-xs text-warm-gray text-right">Rezervirano</span>
        ) : isGroupBuy ? (
          <button
            onClick={(e) => { e.stopPropagation(); onJoinGroup(item) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-sage text-white text-xs font-medium rounded-xl hover:bg-sage/90 transition-colors whitespace-nowrap"
          >
            <Users size={12} />
            Pridruzi se &#x1F465;
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onReserve(item) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose text-white text-xs font-medium rounded-xl hover:bg-rose/90 transition-colors whitespace-nowrap"
          >
            <Gift size={12} />
            Kupit cu ovo
          </button>
        )}
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-warm-gray hover:text-sage transition-colors justify-end"
        >
          <ExternalLink size={11} />
          Shop
        </a>
      </div>
    </div>
  )
}

export default function PublicListClient({ slug }: { slug: string }) {
  const [list, setList] = useState<BabyList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reserveItem, setReserveItem] = useState<ListItem | null>(null)
  const [choiceItem, setChoiceItem] = useState<ListItem | null>(null)
  const [groupBuyItem, setGroupBuyItem] = useState<ListItem | null>(null)
  const [joinGroupItem, setJoinGroupItem] = useState<ListItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved'>('all')

  const refreshList = () => {
    publicApi.getList(slug)
      .then(res => setList(res.data))
      .catch(() => {})
  }

  useEffect(() => {
    publicApi.getList(slug)
      .then(res => setList(res.data))
      .catch(err => {
        setError(err.response?.data?.error || 'Lista nije pronadjena')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const handleReserve = async (itemId: string, name: string, note?: string) => {
    await publicApi.reserve(slug, itemId, name, note)
    setList(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(i =>
          i.id === itemId
            ? { ...i, reservation: { id: 'temp', listItemId: itemId, reservedBy: name, reservedAt: new Date().toISOString(), status: 'RESERVED' as const, note } }
            : i
        )
      }
    })
  }

  const handleChoiceReserve = (item: ListItem) => {
    setChoiceItem(null)
    setReserveItem(item)
  }

  const handleChoiceGroup = (item: ListItem) => {
    setChoiceItem(null)
    setGroupBuyItem(item)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl animate-bounce block mb-4">&#x1F37C;</span>
          <p className="text-warm-gray">Ucitavanje liste...</p>
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center">
          <span className="text-5xl block mb-4">&#x1F614;</span>
          <h1 className="font-serif text-2xl text-charcoal mb-2">Lista nije pronadjena</h1>
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
  const progressPercent = totalItems > 0 ? Math.round((reservedItems / totalItems) * 100) : 0

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

          <div className="flex items-center justify-center gap-4 flex-wrap mt-4">
            {mama.dueDate && (
              <span className="flex items-center gap-1.5 text-sm text-warm-gray bg-white/70 px-3 py-1.5 rounded-full border border-blush/30">
                &#x1F5D3;&#xFE0F; Termin: {format(new Date(mama.dueDate), 'd. MMMM yyyy.', { locale: hr })}
                {daysUntilDue !== null && daysUntilDue > 0 && (
                  <span className="text-rose font-medium">({daysUntilDue} dana)</span>
                )}
              </span>
            )}
            {mama.babyGender && mama.babyGender !== 'surprise' && (
              <span className="flex items-center gap-1.5 text-sm text-warm-gray bg-white/70 px-3 py-1.5 rounded-full border border-blush/30">
                {mama.babyGender === 'boy' ? '&#x1F499; Djecak' : '&#x1F497; Djevojcica'}
              </span>
            )}
            {mama.babyGender === 'surprise' && (
              <span className="flex items-center gap-1.5 text-sm text-warm-gray bg-white/70 px-3 py-1.5 rounded-full border border-blush/30">
                &#x1F380; Iznenadjenje
              </span>
            )}
          </div>

          {list.description && (
            <p className="mt-4 text-warm-gray text-sm italic max-w-md mx-auto">{list.description}</p>
          )}

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

          {totalItems > 0 && (
            <div className="mt-6 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs text-warm-gray mb-1.5">
                <span>{reservedItems} od {totalItems} poklona rezervirano</span>
                <span className="font-medium text-gold">{progressPercent}%</span>
              </div>
              <div className="h-3 bg-white/80 rounded-full border border-blush/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    background: progressPercent === 100
                      ? 'linear-gradient(90deg, #8BA888, #6B9B68)'
                      : 'linear-gradient(90deg, #C9A96E, #D4B87A)',
                  }}
                />
              </div>
              {progressPercent === 100 && (
                <p className="text-xs text-sage font-medium mt-1.5">&#x1F389; Svi pokloni su rezervirani!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="flex gap-2 mb-5">
          {[
            { key: 'all', label: 'Sve' },
            { key: 'available', label: '&#x2713; Slobodno' },
            { key: 'reserved', label: '&#x1F381; Rezervirano' },
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
              dangerouslySetInnerHTML={{ __html: f.label }}
            />
          ))}
        </div>

        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">
                {filter === 'reserved' ? '&#x1F381;' : '&#x1F50D;'}
              </span>
              <p className="text-warm-gray text-sm">
                {filter === 'reserved' ? 'Jos nista nije rezervirano' : 'Nema slobodnih stavki'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <PublicListItem
                key={item.id}
                item={item}
                onReserve={() => setChoiceItem(item)}
                onGroupBuy={() => setGroupBuyItem(item)}
                onJoinGroup={() => setJoinGroupItem(item)}
              />
            ))
          )}
        </div>

        <div className="mt-10 p-5 bg-white/60 rounded-2xl border border-blush/20 text-center">
          <p className="text-sm text-warm-gray">
            &#x1F380; Ova lista je kreirana na{' '}
            <a href="/" className="text-rose hover:underline font-medium">Bebinoj Listi</a>
            . Kupuj direktno u shopu klikom na gumb &quot;Shop&quot; -- nista se ne placa ovdje.
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-warm-gray/50">
            <a href="/privatnost" className="hover:text-warm-gray transition-colors">Politika privatnosti</a>
            {' \u00B7 '}
            <a href="/uvjeti" className="hover:text-warm-gray transition-colors">Uvjeti koristenja</a>
          </p>
        </div>
      </div>

      {/* Choice modal */}
      {choiceItem && (
        <ReserveChoiceModal
          item={choiceItem}
          onClose={() => setChoiceItem(null)}
          onSolo={() => handleChoiceReserve(choiceItem)}
          onGroup={() => handleChoiceGroup(choiceItem)}
        />
      )}

      {/* Reserve modal */}
      {reserveItem && (
        <ReserveModal
          item={reserveItem}
          onClose={() => setReserveItem(null)}
          onReserve={handleReserve}
        />
      )}

      {/* Group buy create modal */}
      {groupBuyItem && (
        <GroupBuyModal
          item={groupBuyItem}
          slug={slug}
          isJoin={false}
          onClose={() => setGroupBuyItem(null)}
          onSuccess={refreshList}
        />
      )}

      {/* Group buy join modal */}
      {joinGroupItem && (
        <GroupBuyModal
          item={joinGroupItem}
          slug={slug}
          isJoin={true}
          onClose={() => setJoinGroupItem(null)}
          onSuccess={refreshList}
        />
      )}
    </div>
  )
}
