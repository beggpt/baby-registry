'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function RegistracijaPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    dueDate: '', babyGender: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        dueDate: form.dueDate || undefined,
        babyGender: form.babyGender || undefined,
      })
      setAuth(res.data.user, res.data.token)
      router.push('/moja-lista')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri registraciji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blush via-cream to-sage-light/30 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blush/60 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-sage-light/50 rounded-full blur-2xl" />
        <div className="relative text-center">
          <span className="text-8xl block mb-6">🍼</span>
          <h2 className="font-serif text-4xl text-charcoal mb-4">
            Svaka beba zaslužuje
            <br />
            savršen doček
          </h2>
          <p className="text-warm-gray max-w-xs mx-auto leading-relaxed">
            Kreiraj svoju listu željenih poklona i podijeli je s onima koji te vole.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-charcoal transition-colors mb-8">
            <ArrowLeft size={14} />
            Natrag
          </Link>

          <h1 className="font-serif text-3xl text-charcoal mb-2">Kreiraj račun</h1>
          <p className="text-warm-gray text-sm mb-8">
            Već imaš račun?{' '}
            <Link href="/prijava" className="text-rose hover:underline font-medium">Prijavi se</Link>
          </p>

          {error && (
            <div className="mb-5 p-3 bg-rose/10 border border-rose/20 rounded-xl text-sm text-rose">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Ime i prezime *</label>
              <input
                type="text" name="name" required
                placeholder="Ana Horvat"
                value={form.name} onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Email *</label>
              <input
                type="email" name="email" required
                placeholder="ana@email.com"
                value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Lozinka *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} name="password" required
                  placeholder="Najmanje 8 znakova"
                  value={form.password} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Termin poroda</label>
                <input
                  type="date" name="dueDate"
                  value={form.dueDate} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Spol bebe</label>
                <select
                  name="babyGender"
                  value={form.babyGender} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors appearance-none"
                >
                  <option value="">Odaberi...</option>
                  <option value="boy">💙 Dječak</option>
                  <option value="girl">💗 Djevojčica</option>
                  <option value="surprise">🎀 Iznenađenje</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-all hover:shadow-lg hover:shadow-rose/20 disabled:opacity-60 mt-2"
            >
              {loading ? 'Kreiram račun...' : 'Kreiraj račun 🎉'}
            </button>
          </form>

          <p className="text-xs text-warm-gray/60 text-center mt-6">
            Registracijom prihvaćaš naše uvjete korištenja
          </p>
        </div>
      </div>
    </div>
  )
}
