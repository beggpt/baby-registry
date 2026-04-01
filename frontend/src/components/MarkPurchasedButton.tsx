'use client'
import { useState } from 'react'
import { publicApi } from '@/lib/api'
import { Check, ShoppingBag } from 'lucide-react'

interface MarkPurchasedProps {
  slug: string
  itemId: string
  reservedBy: string
  onSuccess: () => void
}

export default function MarkPurchasedButton({ slug, itemId, reservedBy, onSuccess }: MarkPurchasedProps) {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMark = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await publicApi.cancelReservation(slug, itemId, name)
      onSuccess()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Greška')
    } finally {
      setLoading(false)
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-xs text-warm-gray hover:text-charcoal transition-colors underline"
      >
        Odustani od rezervacije
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="text"
        placeholder="Tvoje ime za potvrdu"
        value={name}
        onChange={e => setName(e.target.value)}
        className="flex-1 px-3 py-1.5 text-xs border border-blush/40 rounded-lg bg-cream focus:outline-none"
      />
      <button
        onClick={handleMark}
        disabled={!name.trim() || loading}
        className="px-3 py-1.5 text-xs bg-rose text-white rounded-lg disabled:opacity-50"
      >
        {loading ? '...' : 'Potvrdi'}
      </button>
      <button onClick={() => setShow(false)} className="text-xs text-warm-gray">✕</button>
    </div>
  )
}
