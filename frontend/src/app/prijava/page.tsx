'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function PrijavaPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.login(email, password)
      setAuth(res.data.user, res.data.token)
      router.push('/moja-lista')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Pogrešan email ili lozinka')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-charcoal transition-colors mb-8">
          <ArrowLeft size={14} />
          Natrag
        </Link>

        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🍼</span>
          <h1 className="font-serif text-3xl text-charcoal mb-2">Prijava</h1>
          <p className="text-warm-gray text-sm">
            Nemaš račun?{' '}
            <Link href="/registracija" className="text-rose hover:underline font-medium">Registriraj se</Link>
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose/10 border border-rose/20 rounded-xl text-sm text-rose">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email" required
              placeholder="ana@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wide">Lozinka</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'} required
                placeholder="Tvoja lozinka"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-blush/40 rounded-xl text-sm focus:outline-none focus:border-blush-mid transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-rose text-white font-medium rounded-full hover:bg-rose/90 transition-all hover:shadow-lg hover:shadow-rose/20 disabled:opacity-60 mt-2"
          >
            {loading ? 'Prijava...' : 'Prijavi se'}
          </button>
        </form>
      </div>
    </div>
  )
}
