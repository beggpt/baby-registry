'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import { productsApi, adminApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Product } from '@/types'
import { Heart, Share2, Gift, ShoppingBag, ArrowRight } from 'lucide-react'

const OCCASIONS = [
  { value: 'birth',    emoji: '🍼', label: 'Rođenje djeteta' },
  { value: 'birthday', emoji: '🎂', label: 'Rođendan djeteta' },
]

const ALL_CATEGORIES = [
  { emoji: '🛒', name: 'Kolica', slug: 'kolica' },
  { emoji: '🚗', name: 'Autosjedalice', slug: 'autosjedalice' },
  { emoji: '🤱', name: 'Nosiljke', slug: 'nosiljke-nosiljke' },
  { emoji: '🛏️', name: 'Kreveti i vrtići', slug: 'kreveti-vrtici' },
  { emoji: '🍼', name: 'Hranjenje', slug: 'hranjenje' },
  { emoji: '🧴', name: 'Njega', slug: 'njega' },
  { emoji: '🧸', name: 'Igračke za bebe', slug: 'baby-igracke' },
  { emoji: '🎮', name: 'Kreativne igračke', slug: 'kreativne-igracke' },
  { emoji: '📚', name: 'Knjige', slug: 'knjige' },
  { emoji: '👟', name: 'Obuća', slug: 'cipele' },
  { emoji: '👗', name: 'Odjeća', slug: 'kompleti-odjeca' },
  { emoji: '🛁', name: 'Kupanje', slug: 'kupanje' },
  { emoji: '🏃', name: 'Sport i rekreacija', slug: 'na-kotacima' },
  { emoji: '💝', name: 'Za mame', slug: 'za-mame' },
  { emoji: '🛋️', name: 'Posteljina', slug: 'posteljina' },
  { emoji: '🪑', name: 'Hranilice', slug: 'hranilice-stolice' },
]

export default function HomePage() {
  const router = useRouter()
  const { user, loadFromStorage } = useAuthStore()
  const [featured, setFeatured] = useState<Product[]>([])
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  useEffect(() => {
    loadFromStorage()
    productsApi.getFeatured()
      .then(res => setFeatured(res.data))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false))
    adminApi.getSettings()
      .then(res => { if (res.data.heroImage) setHeroImage(res.data.heroImage) })
      .catch(() => {})
  }, [])

  // If logged in, "Kreiraj listu" goes to moja-lista
  const handleKreirajListu = (e: React.MouseEvent) => {
    if (user) {
      e.preventDefault()
      router.push('/moja-lista')
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">

        {/* Hero */}
        <section className="relative pt-28 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {heroImage ? (
              <img src={heroImage} alt="" className="w-full h-full object-cover opacity-20" />
            ) : (
              <>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blush/40 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-sage-light/30 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
              </>
            )}
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blush/60 rounded-full text-rose text-sm font-medium mb-6 fade-in">
              <span>🎀</span> Baby lista za svaku prigodu
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl text-charcoal mb-6 fade-up">
              Tvoja savršena<br />
              <span className="italic text-rose font-serif">bebina lista</span>
            </h1>
            <p className="text-lg text-warm-gray max-w-xl mx-auto mb-8 fade-up" style={{ animationDelay: '0.1s' }}>
              Odaberi što stvarno trebaš. Podijeli s obitelji i prijateljima — neka pokloni budu točno ono što ti je potrebno.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10 fade-up" style={{ animationDelay: '0.15s' }}>
              {OCCASIONS.map(o => (
                <Link key={o.value} href={user ? '/moja-lista' : `/registracija?occasion=${o.value}`}
                  onClick={user ? handleKreirajListu : undefined}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/80 border border-blush/40 rounded-full text-sm text-charcoal hover:border-blush-mid hover:bg-white transition-all">
                  {o.emoji} {o.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center fade-up" style={{ animationDelay: '0.2s' }}>
              <Link href={user ? '/moja-lista' : '/registracija'} onClick={handleKreirajListu}
                className="px-8 py-3.5 bg-rose text-white font-medium rounded-full text-lg hover:bg-rose/90 transition-all hover:shadow-lg hover:shadow-rose/20 hover:-translate-y-0.5">
                {user ? 'Moje liste' : 'Kreiraj svoju listu'}
              </Link>
              <Link href="/katalog"
                className="px-8 py-3.5 bg-white text-charcoal font-medium rounded-full text-lg border border-blush hover:border-blush-mid transition-all">
                Pregledaj katalog
              </Link>
            </div>
          </div>
        </section>

        {/* Istaknuti proizvodi */}
        {(loadingFeatured || featured.length > 0) && (
          <section className="py-16 px-4 bg-white/50">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl text-charcoal">Istaknuti proizvodi</h2>
                  <p className="text-warm-gray mt-1">Naš odabir najpopularnijih proizvoda</p>
                </div>
                <Link href="/katalog" className="flex items-center gap-1.5 text-sm text-rose hover:underline">
                  Svi proizvodi <ArrowRight size={14} />
                </Link>
              </div>
              {loadingFeatured ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden border border-blush/30">
                      <div className="aspect-square shimmer" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 shimmer rounded-full w-3/4" />
                        <div className="h-3 shimmer rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {featured.slice(0, 8).map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Kako funkcionira */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl text-center text-charcoal mb-4">Jednostavno kao <em>jedan, dva, tri</em></h2>
            <p className="text-center text-warm-gray mb-14 max-w-lg mx-auto">Za samo nekoliko minuta imaš svoju listu spremu za dijeljenje</p>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { icon: <Heart className="text-rose" size={28} />, num: '01', title: 'Odaberi prigodu', desc: 'Kreiraj listu za rođenje ili rođendan. Odaberi proizvode iz kataloga.' },
                { icon: <Share2 className="text-sage" size={28} />, num: '02', title: 'Podijeli link', desc: 'Svaka lista dobiva jedinstveni link. Pošalji ga obitelji i prijateljima — bez potrebe za prijavom.' },
                { icon: <Gift className="text-gold" size={28} />, num: '03', title: 'Primaj savršene poklone', desc: 'Prijatelji vide što je slobodno, rezerviraju upisivanjem svog imena i kupuju direktno iz shopa.' },
              ].map((step, i) => (
                <div key={i} className="relative p-6 bg-white rounded-3xl border border-blush/30 shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-cream border border-blush/40 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-warm-gray">{step.num}</span>
                  </div>
                  <div className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center mb-4">{step.icon}</div>
                  <h3 className="font-serif text-xl text-charcoal mb-2">{step.title}</h3>
                  <p className="text-sm text-warm-gray leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sve kategorije */}
        <section className="py-16 px-4 bg-white/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl text-center text-charcoal mb-12">Sve što ti treba, na jednom mjestu</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_CATEGORIES.map(cat => (
                <Link key={cat.slug} href={`/katalog?kategorija=${cat.slug}`}
                  className="group p-4 bg-white rounded-2xl border border-blush/30 hover:border-blush-mid hover:shadow-md transition-all text-center">
                  <span className="text-3xl block mb-2">{cat.emoji}</span>
                  <span className="text-sm font-medium text-charcoal group-hover:text-rose transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/katalog" className="inline-flex items-center gap-2 px-6 py-3 border border-blush-mid text-warm-gray rounded-full text-sm hover:bg-blush/20 transition-colors">
                <ShoppingBag size={16} /> Pregledaj sve proizvode
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-gradient-to-br from-blush/40 via-cream to-sage-light/20 rounded-4xl p-12 border border-blush/30">
              <span className="text-5xl block mb-6">🎀</span>
              <h2 className="text-4xl text-charcoal mb-4">Svaka prigoda zaslužuje savršene poklone</h2>
              <p className="text-warm-gray mb-8 max-w-md mx-auto">Kreiraj listu za svaku posebnu priliku</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {OCCASIONS.map(o => (
                  <Link key={o.value} href={user ? '/moja-lista' : `/registracija?occasion=${o.value}`}
                    onClick={user ? handleKreirajListu : undefined}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-charcoal rounded-full text-sm font-medium border border-blush hover:border-rose hover:text-rose transition-all">
                    {o.emoji} {o.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-blush/30 py-8 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span>🍼</span>
              <span className="font-serif text-charcoal">Bebina Lista</span>
            </div>
            <p className="text-xs text-warm-gray">© {new Date().getFullYear()} Bebina Lista. Napravljeno s ljubavlju. 💕</p>
          </div>
        </footer>
      </main>
    </>
  )
}
