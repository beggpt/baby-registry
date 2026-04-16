'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { listsApi, authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { BabyList, ListItem, Priority, SmartPasteResult, GroupContributor } from '@/types'
import {
  Plus, Link2, Trash2, Heart, ExternalLink, Check,
  X, ChevronDown, ChevronUp, ShoppingBag, Calendar, Edit3, Save,
  Share2, MessageSquare, QrCode, Download, Users, LinkIcon, Loader2
} from 'lucide-react'
import clsx from 'clsx'
import { addRefToUrl } from '@/lib/api'

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
  const day = parseInt(m[1]), month = parseInt(m[2]), year = parseInt(m[3])
  // Use UTC to avoid timezone shifting the date by -1 day
  const d = new Date(Date.UTC(year, month - 1, day))
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null
  return isNaN(d.getTime()) ? null : d
}

// Smart Paste Modal
function SmartPasteModal({ listId, onClose, onSuccess }: {
  listId: string
  onClose: () => void
  onSuccess: (item: ListItem) => void
}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SmartPasteResult | null>(null)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [saving, setSaving] = useState(false)

  const handleFetch = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await listsApi.smartPaste(url.trim())
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nije moguće dohvatiti podatke s tog linka')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      const res = await listsApi.addCustomItem(listId, {
        name: result.title,
        price: result.price,
        imageUrl: result.imageUrl,
        productUrl: result.productUrl,
        description: result.description,
      }, priority)
      onSuccess(res.data)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri spremanju')
      setSaving(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted && pasted.startsWith('http')) {
      setTimeout(() => handleFetch(), 100)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-4 sm:pt-0 sm:p-4 bg-charcoal/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full sm:max-w-md p-5 sm:p-6 shadow-2xl fade-up max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-serif text-xl">Dodaj s linka 🔗</h3>
          <button onClick={onClose} className="p-2 hover:bg-cream rounded-full transition-colors -mr-1">
            <X size={20} className="text-warm-gray" />
          </button>
        </div>

        {/* URL input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Link proizvoda</label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Zalijepi link ovdje..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
              className="flex-1 px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm text-base-mobile focus:outline-none focus:border-rose min-w-0"
            />
            <button
              onClick={handleFetch}
              disabled={!url.trim() || loading}
              className="px-4 py-3 bg-rose text-white rounded-xl text-sm font-medium hover:bg-rose/90 disabled:opacity-50 transition-colors flex-shrink-0 active:scale-[0.97]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Dohvati'}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-rose mb-4">{error}</p>}

        {/* Preview */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-cream rounded-2xl border border-blush/30">
              {result.imageUrl && (
                <img src={result.imageUrl} alt="" className="w-full h-40 object-contain rounded-xl mb-3 bg-white" />
              )}
              <p className="font-medium text-charcoal text-sm">{result.title}</p>
              {result.price && (
                <p className="text-rose font-medium mt-1">{result.price.toFixed(2)} EUR</p>
              )}
              {result.shopName && (
                <p className="text-xs text-warm-gray mt-1">{result.shopName}</p>
              )}
              {result.description && (
                <p className="text-xs text-warm-gray mt-2 line-clamp-3">{result.description}</p>
              )}
            </div>

            {/* Priority selector */}
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Prioritet</label>
              <div className="flex gap-2">
                {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG.HIGH][]).map(([val, conf]) => (
                  <button
                    key={val}
                    onClick={() => setPriority(val)}
                    className={clsx('flex-1 py-2 rounded-xl text-xs font-medium border transition-all active:scale-[0.97]',
                      priority === val ? 'border-rose bg-blush/20' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}
                  >
                    {conf.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors disabled:opacity-50 active:scale-[0.97]"
            >
              {saving ? 'Dodajem...' : 'Dodaj na listu'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Stavka liste - div umjesto <a> da select/button rade ispravno
function ListItemRow({ item, listId, onDelete, onPriorityChange }: {
  item: ListItem; listId: string
  onDelete: (id: string) => void
  onPriorityChange: (id: string, p: Priority) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const { product, reservation } = item
  const price = new Intl.NumberFormat('hr-HR', { style: 'currency', currency: product.currency || 'EUR' }).format(product.price)
  const shopUrl = addRefToUrl(product.productUrl)

  const isGroupBuy = reservation?.isGroupBuy
  const contributors = reservation?.contributors || []
  const totalCollected = contributors.reduce((sum: number, c: GroupContributor) => sum + c.amount, 0)
  const target = reservation?.targetAmount || 0
  const progressPercent = target > 0 ? Math.min(100, Math.round((totalCollected / target) * 100)) : 0

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try { await listsApi.removeItem(listId, item.id); onDelete(item.id) }
    catch { setDeleting(false) }
  }

  const handleRowClick = () => {
    if (product.productUrl) window.open(shopUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onClick={handleRowClick}
      className={clsx(
        'flex gap-3 p-3 bg-white rounded-2xl border transition-all group cursor-pointer',
        'hover:border-blush-mid hover:shadow-sm',
        reservation && !isGroupBuy ? 'border-gold/40 bg-gold/5' : isGroupBuy ? 'border-sage/30 bg-sage-light/5' : 'border-blush/30',
        deleting && 'opacity-40 pointer-events-none'
      )}
    >
      {/* Slika */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-cream rounded-xl overflow-hidden">
        {product.imageUrl
          ? <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
          : <div className="w-full h-full flex items-center justify-center text-lg sm:text-xl opacity-20">🍼</div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1">
          <p className="text-sm font-medium text-charcoal line-clamp-1 group-hover:text-rose transition-colors flex-1">{product.name}</p>
          {product.productUrl && <ExternalLink size={11} className="text-warm-gray/40 group-hover:text-rose transition-colors flex-shrink-0 mt-0.5" />}
        </div>
        <p className="text-xs text-warm-gray mt-0.5">{product.shopName}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-sm font-medium text-rose">{price}</span>
          <select
            value={item.priority}
            onChange={e => { e.stopPropagation(); onPriorityChange(item.id, e.target.value as Priority) }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            className={clsx('text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none font-medium', PRIORITY_CONFIG[item.priority].cls)}
          >
            {Object.entries(PRIORITY_CONFIG).map(([val, conf]) => (
              <option key={val} value={val}>{val === 'HIGH' ? 'Jako želim' : val === 'MEDIUM' ? 'Bilo bi lijepo' : 'Luksuz'}</option>
            ))}
          </select>
          {reservation && !isGroupBuy
            ? <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full font-medium">🎁 {reservation.reservedBy}</span>
            : isGroupBuy
            ? <span className="text-xs px-2 py-0.5 bg-sage-light/60 text-sage rounded-full font-medium">👥 Grupna ({contributors.length})</span>
            : <span className="text-xs px-2 py-0.5 status-available rounded-full">✓ Slobodno</span>
          }
        </div>

        {/* Poruka od osobe koja je rezervirala */}
        {reservation?.note && !isGroupBuy && (
          <div className="mt-2 flex items-start gap-1.5 p-2 bg-sage-light/20 rounded-lg border border-sage/10">
            <MessageSquare size={11} className="text-sage flex-shrink-0 mt-0.5" />
            <p className="text-xs text-charcoal/70 italic leading-relaxed">&quot;{reservation.note}&quot;</p>
          </div>
        )}

        {/* Group buy details for mama */}
        {isGroupBuy && (
          <div className="mt-2 p-3 bg-sage-light/20 rounded-xl border border-sage/10" onClick={e => e.stopPropagation()}>
            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-warm-gray mb-1.5">
              <span>{totalCollected.toFixed(2)} / {target.toFixed(2)} EUR</span>
              <span className="font-medium text-sage">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-white/80 rounded-full border border-sage/20 overflow-hidden mb-2">
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
              <p className="text-xs text-sage font-medium mb-2">🎉 Cilj dostignut!</p>
            )}
            {/* Contributors */}
            <div className="space-y-1">
              {contributors.map((c: GroupContributor) => (
                <div key={c.id} className="flex items-center gap-2 text-xs flex-wrap">
                  <span>{c.role === 'ORDERER' ? '🛒' : '💰'}</span>
                  <span className="font-medium text-charcoal">{c.name}</span>
                  <span className="text-warm-gray">{c.amount.toFixed(2)} EUR</span>
                  {c.note && <span className="text-warm-gray/60 italic truncate max-w-[100px]">- {c.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Brisanje */}
      <button
        onClick={handleDelete}
        className="p-2 text-warm-gray hover:text-rose transition-colors flex-shrink-0 self-start -mr-1"
        title="Ukloni s liste"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// Inline editiranje naziva liste
function EditableListName({ name, onSave }: { name: string; onSave: (newName: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!value.trim() || value === name) { setEditing(false); setValue(name); return }
    setSaving(true)
    await onSave(value.trim())
    setSaving(false)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setEditing(false); setValue(name) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 text-sm font-medium text-charcoal bg-cream border border-rose/40 rounded-lg px-2 py-1 focus:outline-none min-w-0"
        />
        <button onClick={handleSave} disabled={saving} className="text-sage hover:text-sage/80 transition-colors flex-shrink-0">
          {saving ? <span className="text-xs">...</span> : <Check size={14} />}
        </button>
        <button onClick={() => { setEditing(false); setValue(name) }} className="text-warm-gray hover:text-rose transition-colors flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 font-medium text-charcoal hover:text-rose transition-colors group min-w-0 text-left"
      title="Klikni za uređivanje naziva"
    >
      <span className="truncate text-sm">{name}</span>
      <Edit3 size={12} className="text-warm-gray/40 group-hover:text-rose transition-colors flex-shrink-0" />
    </button>
  )
}

// Share modal s WhatsApp, Viber, link, QR kod
function ShareModal({ slug, listName, onClose }: { slug: string; listName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/lista/${slug}` : ''
  const shareText = `Pogledaj moju baby listu "${listName}" 🎀`

  useEffect(() => {
    if (!shareUrl) return
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(shareUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#2C2320', light: '#FAF7F2' },
      }).then(url => setQrDataUrl(url))
        .catch(() => {})
    }).catch(() => {})
  }, [shareUrl])

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `bebina-lista-${slug.substring(0, 8)}-qr.png`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-4 sm:pt-0 sm:p-4 bg-charcoal/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden fade-up max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-start mb-5">
            <h3 className="font-serif text-xl text-charcoal">Podijeli listu</h3>
            <button onClick={onClose} className="p-2 hover:bg-cream rounded-full transition-colors -mr-1 -mt-1">
              <X size={20} className="text-warm-gray" />
            </button>
          </div>

          {/* Link */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2.5 bg-cream border border-blush/40 rounded-xl text-xs text-charcoal font-mono truncate min-w-0"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2.5 bg-charcoal text-white text-xs font-medium rounded-xl hover:bg-charcoal/90 transition-colors whitespace-nowrap flex-shrink-0 active:scale-[0.97]"
            >
              {copied ? '✓ Kopirano!' : 'Kopiraj'}
            </button>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(onClose, 300)}
              className="flex items-center justify-center gap-1.5 px-3 py-3 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-xl text-sm font-medium hover:bg-[#25D366]/20 transition-colors active:scale-[0.97]"
            >
              WhatsApp
            </a>
            <a
              href={`viber://forward?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`}
              onClick={() => setTimeout(onClose, 300)}
              className="flex items-center justify-center gap-1.5 px-3 py-3 bg-[#7360F2]/10 text-[#7360F2] border border-[#7360F2]/20 rounded-xl text-sm font-medium hover:bg-[#7360F2]/20 transition-colors active:scale-[0.97]"
            >
              Viber
            </a>
            <a
              href={`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`}
              onClick={() => setTimeout(onClose, 300)}
              className="flex items-center justify-center gap-1.5 px-3 py-3 bg-[#0084FF]/10 text-[#0084FF] border border-[#0084FF]/20 rounded-xl text-sm font-medium hover:bg-[#0084FF]/20 transition-colors active:scale-[0.97]"
            >
              Messenger
            </a>
          </div>

          {/* QR kod */}
          {qrDataUrl && (
            <div className="text-center border-t border-blush/20 pt-5">
              <p className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-3 flex items-center justify-center gap-1.5">
                <QrCode size={12} />
                QR kod za pozivnicu
              </p>
              <div className="inline-block bg-cream p-3 rounded-2xl border border-blush/30">
                <img src={qrDataUrl} alt="QR kod za listu" className="w-40 h-40 sm:w-48 sm:h-48" />
              </div>
              <p className="text-xs text-warm-gray/60 mt-2 mb-3">
                Skeniraj ili stavi na baby shower pozivnicu
              </p>
              <button
                onClick={downloadQR}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cream border border-blush/40 rounded-full text-xs font-medium text-charcoal hover:bg-blush/30 transition-colors active:scale-[0.97]"
              >
                <Download size={12} />
                Preuzmi QR kod
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewListModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (data: { name: string; occasion: string; dateInput: string; babyGender: string }) => Promise<void>
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
    if (dateInput && dateInput.length === 10 && !parseDMY(dateInput)) {
      setDateError('Datum nije ispravan. Format: dd/mm/yyyy')
      return
    }
    setLoading(true)
    await onCreate({ name, occasion, dateInput, babyGender })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-4 sm:pt-0 sm:p-4 bg-charcoal/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full sm:max-w-md p-5 sm:p-6 shadow-2xl fade-up max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-serif text-xl">Nova lista</h3>
          <button onClick={onClose} className="p-2 hover:bg-cream rounded-full transition-colors -mr-1">
            <X size={20} className="text-warm-gray" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Naziv liste *</label>
            <input type="text" placeholder='npr. "Lista za Mateja"' value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm text-base-mobile focus:outline-none focus:border-rose" />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Za što je lista?</label>
            <div className="grid grid-cols-2 gap-2">
              {OCCASIONS.map(o => (
                <button key={o.value} type="button"
                  onClick={() => { setOccasion(oc => oc === o.value ? '' : o.value); setDateInput(''); setBabyGender('') }}
                  className={clsx('flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium border transition-all active:scale-[0.97]',
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
                  className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm text-base-mobile focus:outline-none focus:border-rose font-mono tracking-wider" />
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
                    className={clsx('flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border transition-all active:scale-[0.97]',
                      babyGender === opt.value ? 'border-rose bg-blush/30' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}>
                    <span className="text-lg">{opt.emoji}</span> {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={!name.trim() || loading}
          className="w-full mt-5 py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors disabled:opacity-50 active:scale-[0.97]">
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
  const [shareModal, setShareModal] = useState<{ slug: string; name: string } | null>(null)
  const [smartPasteListId, setSmartPasteListId] = useState<string | null>(null)
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

  const handleCreate = async ({ name, occasion, dateInput, babyGender }: { name: string; occasion: string; dateInput: string; babyGender: string }) => {
    let dueDate: string | undefined
    if (dateInput && parseDMY(dateInput)) dueDate = parseDMY(dateInput)!.toISOString()

    if (dueDate || babyGender) {
      try { await authApi.updateProfile({ dueDate, babyGender: babyGender || undefined }) } catch {}
    }

    const res = await listsApi.create({ name, occasion: occasion as any || undefined })
    const newList = { ...res.data, items: [], _count: { items: 0 } }
    setLists(prev => [newList, ...prev])
    setExpandedList(newList.id)
    showToast('Lista kreirana!')
  }

  const handleRenameList = async (listId: string, newName: string) => {
    await listsApi.update(listId, { name: newName })
    setLists(prev => prev.map(l => l.id === listId ? { ...l, name: newName } : l))
    showToast('Naziv promijenjen!')
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

  const handleSmartPasteSuccess = (listId: string, item: ListItem) => {
    setLists(prev => prev.map(l => l.id === listId
      ? { ...l, items: [...l.items, item], _count: { items: (l._count?.items || 0) + 1 } }
      : l
    ))
    showToast('Proizvod dodan s linka!')
  }

  const getOcc = (occ?: string | null) => OCCASIONS.find(o => o.value === occ)

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
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="py-6 sm:py-8 flex items-end justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl sm:text-3xl text-charcoal truncate">Hej, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-warm-gray text-sm mt-1">{lists.length === 0 ? 'Kreiraj svoju prvu listu' : `Imaš ${lists.length} ${lists.length === 1 ? 'listu' : 'liste'}`}</p>
            </div>
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 bg-rose text-white text-sm font-medium rounded-full hover:bg-rose/90 transition-colors flex-shrink-0 active:scale-[0.97]">
              <Plus size={16} /> <span className="hidden sm:inline">Nova</span> lista
            </button>
          </div>

          {lists.length === 0 && (
            <div className="text-center py-16 sm:py-20 bg-white rounded-3xl border border-blush/30 px-6">
              <span className="text-5xl sm:text-6xl block mb-4">💝</span>
              <h3 className="font-serif text-xl sm:text-2xl text-charcoal mb-3">Tvoja prva lista te čeka</h3>
              <p className="text-warm-gray mb-8 max-w-sm mx-auto text-sm">Kreiraj listu, dodaj proizvode i podijeli je s obitelji i prijateljima</p>
              <button onClick={() => setShowNewModal(true)} className="px-6 py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors active:scale-[0.97]">Kreiraj listu</button>
            </div>
          )}

          <div className="space-y-4">
            {lists.map(list => {
              const isExpanded = expandedList === list.id
              const reservedCount = list.items?.filter(i => i.reservation).length || 0
              const totalCount = list._count?.items || list.items?.length || 0
              const occ = getOcc(list.occasion)

              return (
                <div key={list.id} className="bg-white rounded-3xl border border-blush/30 overflow-hidden">
                  <div className="p-4 sm:p-5 flex items-center gap-2 sm:gap-3">
                    <button onClick={() => setExpandedList(isExpanded ? null : list.id)}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-blush/40 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-base sm:text-lg">{occ ? occ.emoji : '💝'}</span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <EditableListName
                        name={list.name}
                        onSave={(newName) => handleRenameList(list.id, newName)}
                      />
                      <p className="text-xs text-warm-gray mt-0.5">
                        {totalCount} stavki · {reservedCount} rez.
                        {occ && <span className="ml-1.5 px-1.5 py-0.5 bg-blush/30 text-rose rounded-full text-xs hidden sm:inline">{occ.label}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button onClick={() => setShareModal({ slug: list.shareSlug, name: list.name })}
                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-sage bg-sage-light/50 rounded-full hover:bg-sage-light transition-colors active:scale-[0.97]">
                        <Share2 size={12} />
                        <span className="hidden sm:inline">Dijeli</span>
                      </button>
                      <button onClick={() => handleDeleteList(list.id)} className="p-1.5 text-warm-gray hover:text-rose transition-colors">
                        <Trash2 size={15} />
                      </button>
                      <button onClick={() => setExpandedList(isExpanded ? null : list.id)} className="p-1.5 text-warm-gray">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-blush/20 p-3 sm:p-4 space-y-2">
                      {list.items?.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-warm-gray text-sm mb-3">Lista je prazna</p>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <a href="/katalog" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blush/40 text-charcoal text-sm rounded-full hover:bg-blush transition-colors w-full sm:w-auto justify-center">
                              <ShoppingBag size={14} /> Dodaj iz kataloga
                            </a>
                            <button
                              onClick={() => setSmartPasteListId(list.id)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sage-light/60 text-sage text-sm rounded-full hover:bg-sage-light transition-colors w-full sm:w-auto justify-center"
                            >
                              <LinkIcon size={14} /> Dodaj s linka
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-warm-gray/60 mb-2">Klikni na stavku za otvaranje u shopu</p>
                          {list.items.map(item => (
                            <ListItemRow key={item.id} item={item} listId={list.id}
                              onDelete={id => handleDeleteItem(list.id, id)}
                              onPriorityChange={(id, p) => handlePriorityChange(list.id, id, p)} />
                          ))}
                          <div className="flex flex-col sm:flex-row gap-2 mt-1">
                            <a href="/katalog" className="flex items-center justify-center gap-2 flex-1 py-3 border-2 border-dashed border-blush/40 rounded-2xl text-sm text-warm-gray hover:border-blush-mid hover:text-charcoal transition-colors">
                              <Plus size={14} /> Iz kataloga
                            </a>
                            <button
                              onClick={() => setSmartPasteListId(list.id)}
                              className="flex items-center justify-center gap-2 flex-1 py-3 border-2 border-dashed border-sage/30 rounded-2xl text-sm text-sage hover:border-sage hover:text-sage/80 transition-colors"
                            >
                              <LinkIcon size={14} /> S linka
                            </button>
                          </div>
                        </>
                      )}
                      <div className="pt-2 border-t border-blush/20 flex items-center justify-between">
                        <p className="text-xs text-warm-gray font-mono truncate max-w-[150px] sm:max-w-none">/lista/{list.shareSlug.substring(0, 10)}...</p>
                        <a href={`/lista/${list.shareSlug}`} target="_blank" className="flex items-center gap-1 text-xs text-sage hover:underline flex-shrink-0">
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
      {shareModal && <ShareModal slug={shareModal.slug} listName={shareModal.name} onClose={() => setShareModal(null)} />}
      {smartPasteListId && (
        <SmartPasteModal
          listId={smartPasteListId}
          onClose={() => setSmartPasteListId(null)}
          onSuccess={(item) => handleSmartPasteSuccess(smartPasteListId, item)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-charcoal text-white text-sm rounded-full shadow-2xl fade-in whitespace-nowrap">
          {toast}
        </div>
      )}
    </>
  )
}
