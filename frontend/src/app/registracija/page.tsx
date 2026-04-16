'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

const OCCASIONS = [
  { value: 'birth',    emoji: '🍼', label: 'Rođenje djeteta',  dateLabel: 'Planirani termin poroda' },
  { value: 'birthday', emoji: '🎂', label: 'Rođendan djeteta', dateLabel: 'Datum rođendana' },
]

function parseDMY(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const day = parseInt(m[1]), month = parseInt(m[2]), year = parseInt(m[3])
  // Use UTC to avoid timezone shifting the date by -1 day
  const d = new Date(Date.UTC(year, month - 1, day))
  // Validate the date components match (catches invalid dates like 31/02)
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null
  return isNaN(d.getTime()) ? null : d
}

declare global { interface Window { google?: any } }

export default function RegistracijaPage() {
  const router = useRouter()
  const { user, setAuth, loadFromStorage } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', dateInput: '', babyGender: '', occasion: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const selectedOcc = OCCASIONS.find(o => o.value === form.occasion)

  useEffect(() => {
    loadFromStorage()
  }, [])

  // Ako je već logiran, idi na moja-lista
  useEffect(() => {
    if (user) router.push('/moja-lista')
  }, [user])

  useEffect(() => {
    if (!googleClientId) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential: string }) => {
          try {
            const res = await authApi.googleLogin(response.credential)
            setAuth(res.data.user, res.data.token)
            router.push('/moja-lista')
          } catch (err: any) {
            setError(err.response?.data?.error || 'Google prijava nije uspjela')
          }
        },
      })
      window.google?.accounts.id.renderButton(document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signup_with', locale: 'hr' })
    }
    document.head.appendChild(script)
  }, [googleClientId])

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, '')
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2)
    if (val.length >= 6) val = val.slice(0, 5) + '/' + val.slice(5)
    setForm(p => ({ ...p, dateInput: val.slice(0, 10) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Molimo ispunite sva obavezna polja'); return }
    let dueDate: string | undefined
    if (form.dateInput && form.occasion) {
      const parsed = parseDMY(form.dateInput)
      if (!parsed) { setError('Datum nije ispravan. Format: dd/mm/yyyy'); return }
      dueDate = parsed.toISOString()
    }
    setLoading(true); setError(null)
    try {
      const res = await authApi.register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, dueDate, babyGender: form.babyGender || undefined })
      setAuth(res.data.user, res.data.token)
      router.push('/moja-lista')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri registraciji.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-cream flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blush via-cream to-sage-light/30 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blush/60 rounded-full blur-3xl" />
        <div className="relative text-center">
          <span className="text-8xl block mb-6">🍼</span>
          <h2 className="font-serif text-4xl text-charcoal mb-4">Svaka beba zaslužuje savršen doček</h2>
          <p className="text-warm-gray max-w-xs mx-auto leading-relaxed mb-8">Kreiraj svoju listu željenih poklona i podijeli je s onima koji te vole.</p>
          <div className="flex flex-col gap-3">
            {OCCASIONS.map(o => (
              <div key={o.value} className="flex items-center gap-3 bg-white/50 rounded-2xl px-5 py-3.5 text-left">
                <span className="text-2xl">{o.emoji}</span>
                <span className="text-sm text-charcoal font-medium">{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-charcoal mb-8"><ArrowLeft size={14} /> Natrag</Link>
          <h1 className="font-serif text-3xl text-charcoal mb-1">Kreiraj račun</h1>
          <p className="text-warm-gray text-sm mb-6">Već imaš račun? <Link href="/prijava" className="text-rose hover:underline font-medium">Prijavi se</Link></p>
          {error && <div className="mb-5 p-3 bg-rose/10 border border-rose/20 rounded-xl text-sm text-rose">{error}</div>}
          {googleClientId && (
            <>
              <div id="google-btn" className="w-full mb-4" />
              <div className="flex items-center gap-3 mb-5"><div className="flex-1 h-px bg-blush/40" /><span className="text-xs text-warm-gray">ili s emailom</span><div className="flex-1 h-px bg-blush/40" /></div>
            </>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Ime i prezime *</label>
              <input type="text" required placeholder="Ana Horvat" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose" />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Email *</label>
              <input type="email" required placeholder="ana@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose" />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Lozinka *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required placeholder="Najmanje 6 znakova" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Za što kreiramo listu?</label>
              <div className="grid grid-cols-2 gap-2">
                {OCCASIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setForm(p => ({ ...p, occasion: p.occasion === o.value ? '' : o.value, dateInput: '' }))}
                    className={clsx('flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all',
                      form.occasion === o.value ? 'border-rose bg-blush/30 text-charcoal' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}>
                    <span className="text-xl">{o.emoji}</span> {o.label}
                  </button>
                ))}
              </div>
            </div>
            {selectedOcc && (
              <div>
                <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">{selectedOcc.dateLabel}</label>
                <div className="relative">
                  <input type="text" placeholder="15/06/2025" value={form.dateInput} onChange={handleDateInput} maxLength={10}
                    className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose font-mono tracking-wider" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-warm-gray/50">dd/mm/yyyy</span>
                </div>
                {form.dateInput.length === 10 && parseDMY(form.dateInput) && (
                  <p className="text-xs text-sage mt-1">✓ {parseDMY(form.dateInput)?.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
              </div>
            )}
            {form.occasion === 'birth' && (
              <div>
                <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Spol bebe</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ value: 'boy', emoji: '💙', label: 'Dječak' }, { value: 'girl', emoji: '💗', label: 'Djevojčica' }, { value: 'surprise', emoji: '🎀', label: 'Iznenađenje' }].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, babyGender: p.babyGender === opt.value ? '' : opt.value }))}
                      className={clsx('flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium border transition-all',
                        form.babyGender === opt.value ? 'border-rose bg-blush/30' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}>
                      <span className="text-xl">{opt.emoji}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-all hover:shadow-lg disabled:opacity-60 mt-2">
              {loading ? 'Kreiram račun...' : 'Kreiraj račun 🎉'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
