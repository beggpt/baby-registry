import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <span className="text-7xl block mb-6">🍼</span>
        <h1 className="font-serif text-4xl text-charcoal mb-3">404</h1>
        <p className="text-warm-gray mb-8">Ova stranica ne postoji ili je premještena.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-rose text-white rounded-full font-medium hover:bg-rose/90 transition-colors"
        >
          Idi na početnu
        </Link>
      </div>
    </div>
  )
}
