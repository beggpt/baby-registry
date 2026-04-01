'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

const OCCASIONS = [
  { value: 'birth', emoji: '🍼', label: 'Rođenje djeteta' },
  { value: 'birthday', emoji: '🎂', label: 'Rođendan' },
  { value: 'baptism', emoji: '✝️', label: 'Krstitke' },
  { value: 'confirmation', emoji: '🕊️', label: 'Krizma' },
  { value: 'other', emoji: '🎁', label: 'Ostalo' },
]

declare global { interface Window { google?: any } }

export default function RegistracijaPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', dueDate: '', babyGender: '', occasion: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!googleClientId) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleLogin,
      })
      window.google?.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signup_with', locale: 'hr' }
      )
    }
    document.head.appendChild(script)
  }, [googleClientId])

  const handleGoogleLogin = async (response: { credential: string }) => {
    setGoogleLoading(true)
    setError(null)
    try {
      const res = await authApi.googleLogin(response.credential)
      setAuth(res.data.user, res.data.token)
      router.push('/moja-lista')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google prijava nije uspjela')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setError('Molimo ispunite sva obavezna polja')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        dueDate: form.dueDate || undefined,
        babyGender: form.babyGender || undefined,
      })
      setAuth(res.data.user, res.data.token)
      router.push('/moja-lista')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri registraciji. Pokušaj ponovo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Dekorativni lijevi panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blush via-cream to-sage-light/30 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blush/60 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-sage-light/50 rounded-full blur-2xl" />
        <div className="relative text-center">
          <span className="text-8xl block mb-6">🍼</span>
          <h2 className="font-serif text-4xl text-charcoal mb-4">Svaka beba zaslužuje savršen doček</h2>
          <p className="text-warm-gray max-w-xs mx-auto leading-relaxed">
            Kreiraj svoju listu željenih poklona i podijeli je s onima koji te vole.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {OCCASIONS.map(o => (
              <div key={o.value} className="flex items-center gap-3 bg-white/50 rounded-2xl px-4 py-3 text-left">
                <span className="text-2xl">{o.emoji}</span>
                <span className="text-sm text-charcoal font-medium">{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forma */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-charcoal transition-colors mb-8">
            <ArrowLeft size={14} /> Natrag
          </Link>

          <h1 className="font-serif text-3xl text-charcoal mb-1">Kreiraj račun</h1>
          <p className="text-warm-gray text-sm mb-6">
            Već imaš račun?{' '}
            <Link href="/prijava" className="text-rose hover:underline font-medium">Prijavi se</Link>
          </p>

          {error && (
            <div className="mb-5 p-3 bg-rose/10 border border-rose/20 rounded-xl text-sm text-rose">
              {error}
            </div>
          )}

          {/* Google OAuth */}
          {googleClientId && (
            <>
              <div id="google-btn" className="w-full mb-4" />
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-blush/40" />
                <span className="text-xs text-warm-gray">ili s emailom</span>
                <div className="flex-1 h-px bg-blush/40" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Ime i prezime *</label>
              <input type="text" name="name" required placeholder="Ana Horvat" value={form.name} onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Email *</label>
              <input type="email" name="email" required placeholder="ana@email.com" value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Lozinka *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" required placeholder="Najmanje 6 znakova" value={form.password} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose transition-colors pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Prigoda */}
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wide">Prigoda za listu</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {OCCASIONS.map(o => (
                  <button key={o.value} type="button"
                    onClick={() => setForm(p => ({ ...p, occasion: p.occasion === o.value ? '' : o.value }))}
                    className={clsx('flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left',
                      form.occasion === o.value ? 'border-rose bg-blush/30 text-charcoal' : 'border-blush/40 text-warm-gray hover:border-blush-mid')}>
                    <span>{o.emoji}</span> {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opcionalno */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Termin</label>
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange}
                  className="w-full px-3 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Spol bebe</label>
                <select name="babyGender" value={form.babyGender} onChange={handleChange}
                  className="w-full px-3 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-rose transition-colors appearance-none">
                  <option value="">Odaberi...</option>
                  <option value="boy">💙 Dječak</option>
                  <option value="girl">💗 Djevojčica</option>
                  <option value="surprise">🎀 Iznenađenje</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-all hover:shadow-lg hover:shadow-rose/20 disabled:opacity-60 mt-2">
              {loading ? 'Kreiram račun...' : 'Kreiraj račun 🎉'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
