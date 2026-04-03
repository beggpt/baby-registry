'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { listsApi, authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { BabyList, ListItem, Priority } from '@/types'
import {
  Plus, Link2, Trash2, Heart, ExternalLink, Check,
  X, ChevronDown, ChevronUp, ShoppingBag, Calendar, Edit3, Save,
  Share2, MessageSquare, QrCode, Download
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
  const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  return isNaN(d.getTime()) ? null : d
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try { await listsApi.removeItem(listId, item.id); onDelete(item.id) }
    catch { setDeleting(false) }
  }

  const handleRowClick = () => {
    window.open(shopUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onClick={handleRowClick}
      className={clsx(
        'flex gap-3 p-3 bg-white rounded-2xl border transition-all group cursor-pointer',
        'hover:border-blush-mid hover:shadow-sm',
        reservation ? 'border-gold/40 bg-gold/5' : 'border-blush/30',
        deleting && 'opacity-40 pointer-events-none'
      )}
    >
      {/* Slika */}
      <div className="w-14 h-14 flex-shrink-0 bg-cream rounded-xl overflow-hidden">
        {product.imageUrl
          ? <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
          : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">🍼</div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1">
          <p className="text-sm font-medium text-charcoal line-clamp-1 group-hover:text-rose transition-colors flex-1">{product.name}</p>
          <ExternalLink size={11} className="text-warm-gray/40 group-hover:text-rose transition-colors flex-shrink-0 mt-0.5" />
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
              <option key={val} value={val}>{conf.label}</option>
            ))}
          </select>
          {reservation
            ? <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full font-medium">🎁 {reservation.reservedBy}</span>
            : <span className="text-xs px-2 py-0.5 status-available rounded-full">✓ Slobodno</span>
          }
        </div>

        {/* Poruka od osobe koja je rezervirala */}
        {reservation?.note && (
          <div className="mt-2 flex items-start gap-1.5 p-2 bg-sage-light/20 rounded-lg border border-sage/10">
            <MessageSquare size={11} className="text-sage flex-shrink-0 mt-0.5" />
            <p className="text-xs text-charcoal/70 italic leading-relaxed">&quot;{reservation.note}&quot;</p>
          </div>
        )}
      </div>

      {/* Brisanje */}
      <button
        onClick={handleDelete}
        className="p-1.5 text-warm-gray hover:text-rose transition-colors flex-shrink-0 self-start"
        title="Ukloni s liste"
      >
        <Trash2 size={13} />
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
          autoFocus
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
      className="flex items-center gap-1.5 font-medium text-charcoal hover:text-rose transition-colors group min-w-0"
      title="Klikni za uređivanje naziva"
    >
      <span className="truncate">{name}</span>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden fade-up">
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <h3 className="font-serif text-xl text-charcoal">Podijeli listu</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-full transition-colors">
              <X size={18} className="text-warm-gray" />
            </button>
          </div>

          {/* Link */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2.5 bg-cream border border-blush/40 rounded-xl text-xs text-charcoal font-mono truncate"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2.5 bg-charcoal text-white text-xs font-medium rounded-xl hover:bg-charcoal/90 transition-colors whitespace-nowrap"
            >
              {copied ? '✓ Kopirano!' : 'Kopiraj'}
            </button>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-xl text-sm font-medium hover:bg-[#25D366]/20 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a
              href={`viber://forward?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#7360F2]/10 text-[#7360F2] border border-[#7360F2]/20 rounded-xl text-sm font-medium hover:bg-[#7360F2]/20 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.398.002C9.473.028 5.331.344 3.014 2.467.312 4.95-.058 8.58.004 12.159c.063 3.578.695 10.075 6.838 11.77l.007.001h.006l-.003 2.7s-.037.542.335.654c.449.136.712-.29.712-.29s.818-.932 1.69-2.052c2.924.254 5.173-.315 5.424-.394.578-.182 3.847-.607 4.382-4.952.553-4.485-.267-7.333-1.748-8.615-.03-.027-.06-.052-.088-.079 0 0 .001 0 0 0-.522-1.227-1.6-2.388-3.1-3.322C12.832.533 11.9.049 11.398.002zm.136 1.474c.377.03 1.192.405 2.577 1.194 1.326.826 2.263 1.833 2.681 2.863l.003.007c.013.035.025.07.035.107.022.074.03.16.005.258.972.875 2.043 2.825 1.634 6.158l-.003.021c-.458 3.692-3.173 4.058-3.672 4.215-.21.066-2.226.568-4.834.388l-.006.007c-.62.718-1.622 1.87-1.622 1.87-.31.366-.63.328-.624-.156l.021-2.142c-5.18-1.422-4.852-6.886-4.802-9.703.05-2.816.71-5.787 2.97-7.948 1.915-1.778 5.258-2.148 6.636-2.138h1.001zM11.376 4.4a.31.31 0 00-.209.09.307.307 0 00.006.434c.034.032.073.058.115.074a.318.318 0 00.242-.015.308.308 0 00.138-.394.31.31 0 00-.292-.189zm.994.098c-.05.002-.098.014-.143.04-.21.12-.345.48-.335.62.015.21.21.41.412.35.195-.055.327-.2.33-.42.002-.215-.039-.6-.264-.59zm-2.132.25a.31.31 0 00-.236.08.307.307 0 00-.024.434.32.32 0 00.356.07.311.311 0 00.197-.233.307.307 0 00-.097-.288.312.312 0 00-.196-.064zm3.146.156c-.048 0-.097.01-.143.032-.32.157-.472.597-.33.76.162.186.475.195.653-.01.175-.2.14-.636-.037-.752a.315.315 0 00-.143-.03zM8.937 5.42a.31.31 0 00-.253.068.307.307 0 00-.05.433.317.317 0 00.383.082.308.308 0 00.17-.254.307.307 0 00-.119-.273.31.31 0 00-.13-.056zm6.015.398l-.122.013c-.413.093-.656.665-.435.877.193.185.567.144.758-.105.19-.25.21-.705-.059-.77a.307.307 0 00-.142-.015zm-7.086.433a.31.31 0 00-.264.06.307.307 0 00.023.497.319.319 0 00.306.011.31.31 0 00.173-.24.307.307 0 00-.238-.328zm.93 3.655c-.074 0-.15.023-.221.072-.27.187-.31.474-.053.618.258.145.6.023.667-.234.067-.257-.117-.456-.393-.456zm1.088 4.222c-.094 0-.186.034-.258.1a.44.44 0 00.033.66c.199.149.487.13.662-.044.18-.178.14-.5-.063-.64a.46.46 0 00-.293-.08l-.081.004z"/></svg>
              Viber
            </a>
          </div>

          {/* Messenger */}
          <a
            href={`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#0084FF]/10 text-[#0084FF] border border-[#0084FF]/20 rounded-xl text-sm font-medium hover:bg-[#0084FF]/20 transition-colors mb-5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/></svg>
            Messenger
          </a>

          {/* QR kod */}
          {qrDataUrl && (
            <div className="text-center border-t border-blush/20 pt-5">
              <p className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-3 flex items-center justify-center gap-1.5">
                <QrCode size={12} />
                QR kod za pozivnicu
              </p>
              <div className="inline-block bg-cream p-3 rounded-2xl border border-blush/30">
                <img src={qrDataUrl} alt="QR kod za listu" className="w-48 h-48" />
              </div>
              <p className="text-xs text-warm-gray/60 mt-2 mb-3">
                Skeniraj ili stavi na baby shower pozivnicu
              </p>
              <button
                onClick={downloadQR}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cream border border-blush/40 rounded-full text-xs font-medium text-charcoal hover:bg-blush/30 transition-colors"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-serif text-xl">Nova lista</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-full transition-colors">
            <X size={18} className="text-warm-gray" />
          </button>
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
                  onClick={() => { setOccasion(oc => oc === o.value ? '' : o.value); setDateInput(''); setBabyGender('') }}
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

        <button onClick={handleSubmit} disabled={!name.trim() || loading}
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
  const [shareModal, setShareModal] = useState<{ slug: string; name: string } | null>(null)
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
    showToast('Lista kreirana! 🎉')
  }

  const handleRenameList = async (listId: string, newName: string) => {
    await listsApi.update(listId, { name: newName })
    setLists(prev => prev.map(l => l.id === listId ? { ...l, name: newName } : l))
    showToast('Naziv promijenjen! ✓')
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
              <p className="text-warm-gray mb-8 max-w-sm mx-auto text-sm">Kreiraj listu, dodaj proizvode i podijeli je s obitelji i prijateljima</p>
              <button onClick={() => setShowNewModal(true)} className="px-6 py-3 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-colors">Kreiraj listu</button>
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
                  <div className="p-5 flex items-center gap-3">
                    {/* Ikona prigode */}
                    <button onClick={() => setExpandedList(isExpanded ? null : list.id)}
                      className="w-10 h-10 bg-blush/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{occ ? occ.emoji : '💝'}</span>
                    </button>

                    {/* Naziv - klikabilan za edit */}
                    <div className="flex-1 min-w-0">
                      <EditableListName
                        name={list.name}
                        onSave={(newName) => handleRenameList(list.id, newName)}
                      />
                      <p className="text-xs text-warm-gray mt-0.5">
                        {totalCount} stavki · {reservedCount} rezervirano
                        {occ && <span className="ml-2 px-1.5 py-0.5 bg-blush/30 text-rose rounded-full text-xs">{occ.label}</span>}
                      </p>
                    </div>

                    {/* Akcije */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setShareModal({ slug: list.shareSlug, name: list.name })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sage bg-sage-light/50 rounded-full hover:bg-sage-light transition-colors">
                        <Share2 size={12} />
                        Dijeli
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
                    <div className="border-t border-blush/20 p-4 space-y-2">
                      {list.items?.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-warm-gray text-sm mb-3">Lista je prazna</p>
                          <a href="/katalog" className="inline-flex items-center gap-2 px-4 py-2 bg-blush/40 text-charcoal text-sm rounded-full hover:bg-blush transition-colors">
                            <ShoppingBag size={14} /> Dodaj iz kataloga
                          </a>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-warm-gray/60 mb-2">Klikni na stavku za otvaranje u shopu</p>
                          {list.items.map(item => (
                            <ListItemRow key={item.id} item={item} listId={list.id}
                              onDelete={id => handleDeleteItem(list.id, id)}
                              onPriorityChange={(id, p) => handlePriorityChange(list.id, id, p)} />
                          ))}
                          <a href="/katalog" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-blush/40 rounded-2xl text-sm text-warm-gray hover:border-blush-mid hover:text-charcoal transition-colors mt-1">
                            <Plus size={14} /> Dodaj još proizvoda
                          </a>
                        </>
                      )}
                      <div className="pt-2 border-t border-blush/20 flex items-center justify-between">
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
      {shareModal && <ShareModal slug={shareModal.slug} listName={shareModal.name} onClose={() => setShareModal(null)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-charcoal text-white text-sm rounded-full shadow-2xl fade-in">
          {toast}
        </div>
      )}
    </>
  )
}
