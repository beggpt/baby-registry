'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { User, Calendar, Baby, Save, Check } from 'lucide-react'

export default function ProfilPage() {
  const router = useRouter()
  const { user, setAuth, token, isLoading: authLoading, loadFromStorage } = useAuthStore()
  const [form, setForm] = useState({ name: '', dueDate: '', babyGender: '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/prijava'); return }
    if (user) {
      setForm({
        name: user.name || '',
        dueDate: user.dueDate ? user.dueDate.substring(0, 10) : '',
        babyGender: user.babyGender || '',
      })
    }
  }, [user, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.updateProfile({
        name: form.name,
        dueDate: form.dueDate || undefined,
        babyGender: form.babyGender || undefined,
      })
      // Ažuriraj store
      if (token) setAuth(res.data, token)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri spremanju')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return null

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="py-8">
            <h1 className="font-serif text-3xl text-charcoal mb-1">Moj profil</h1>
            <p className="text-warm-gray text-sm">{user?.email}</p>
          </div>

          <div className="bg-white rounded-3xl border border-blush/30 p-6 shadow-sm">
            {error && (
              <div className="mb-5 p-3 bg-rose/10 border border-rose/20 rounded-xl text-sm text-rose">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                  <User size={11} />
                  Ime i prezime
                </label>
                <input
                  type="text" required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                  <Calendar size={11} />
                  Termin poroda
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-cream border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">
                  <Baby size={11} />
                  Spol bebe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'boy', emoji: '💙', label: 'Dječak' },
                    { value: 'girl', emoji: '💗', label: 'Djevojčica' },
                    { value: 'surprise', emoji: '🎀', label: 'Iznenađenje' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, babyGender: p.babyGender === opt.value ? '' : opt.value }))}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        form.babyGender === opt.value
                          ? 'border-rose bg-blush/30 text-charcoal scale-[1.02]'
                          : 'border-blush/40 text-warm-gray hover:border-blush-mid'
                      }`}
                    >
                      <span className="block text-xl mb-0.5">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  saved
                    ? 'bg-sage text-white'
                    : 'bg-rose text-white hover:bg-rose/90 hover:shadow-lg hover:shadow-rose/20'
                } disabled:opacity-50`}
              >
                {saved ? (
                  <><Check size={16} /> Spremljeno!</>
                ) : loading ? (
                  'Sprema se...'
                ) : (
                  <><Save size={16} /> Spremi promjene</>
                )}
              </button>
            </form>
          </div>

          {/* Opasna zona */}
          <div className="mt-6 p-5 border border-rose/20 rounded-2xl bg-rose/5">
            <h3 className="text-sm font-medium text-rose mb-1">Zona opasnosti</h3>
            <p className="text-xs text-warm-gray mb-3">
              Brisanje računa je permanentno i ne može se poništiti.
            </p>
            <button className="text-xs text-rose/70 hover:text-rose underline transition-colors">
              Obriši moj račun
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
