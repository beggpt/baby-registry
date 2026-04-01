'use client'
import Image from 'next/image'
import { useState } from 'react'
import { Heart, ExternalLink } from 'lucide-react'
import { Product } from '@/types'
import { addRefToUrl } from '@/lib/api'
import clsx from 'clsx'

interface ProductCardProps {
  product: Product
  onAddToList?: (product: Product) => void
  isOnList?: boolean
  compact?: boolean
}

export default function ProductCard({ product, onAddToList, isOnList, compact }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const shopUrl = addRefToUrl(product.productUrl)

  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price)

  if (compact) {
    return (
      <div className="flex gap-3 p-3 bg-white rounded-2xl border border-blush/30 hover:border-blush-mid transition-all">
        <div className="w-16 h-16 flex-shrink-0 bg-cream rounded-xl overflow-hidden">
          {product.imageUrl && !imgError ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><span className="text-2xl opacity-20">🍼</span></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-charcoal line-clamp-2 leading-snug">{product.name}</p>
          <p className="text-sm text-rose font-medium mt-0.5">{formattedPrice}</p>
          <div className="flex gap-2 mt-1.5">
            {onAddToList && (
              <button onClick={() => onAddToList(product)} className={clsx('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors', isOnList ? 'bg-rose/10 text-rose' : 'bg-blush/50 text-charcoal hover:bg-blush')}>
                <Heart size={10} className={isOnList ? 'fill-rose' : ''} />
                {isOnList ? 'Na listi' : 'Dodaj'}
              </button>
            )}
            <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sage-light/60 text-sage hover:bg-sage-light transition-colors">
              <ExternalLink size={10} /> Shop
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-card bg-white rounded-3xl overflow-hidden border border-blush/30 group flex flex-col">
      {/* Slika */}
      <div className="relative bg-cream overflow-hidden aspect-square">
        {product.imageUrl && !imgError ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-3" onError={() => setImgError(true)} sizes="(max-width: 768px) 50vw, 25vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-5xl opacity-20">🍼</span></div>
        )}
        {!product.inStock && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-warm-gray/80 text-white text-xs rounded-full">Nedostupno</div>
        )}
        {onAddToList && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-charcoal/10">
            <button onClick={() => onAddToList(product)} className={clsx('flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all', isOnList ? 'bg-rose text-white' : 'bg-white text-charcoal hover:bg-rose hover:text-white')}>
              <Heart size={14} className={isOnList ? 'fill-white' : ''} />
              {isOnList ? 'Na listi' : 'Dodaj na listu'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col p-4 flex-1">
        {product.category && <span className="text-xs text-warm-gray/60 mb-1">{product.category.name}</span>}
        <h3 className="text-sm font-medium text-charcoal line-clamp-2 leading-snug mb-2 flex-1">{product.name}</h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-base font-medium text-charcoal">{formattedPrice}</span>
          <span className="text-xs text-warm-gray/50">{product.shopName}</span>
        </div>
        <div className="flex gap-2 mt-3">
          {onAddToList && (
            <button onClick={() => onAddToList(product)} className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-colors', isOnList ? 'bg-rose/10 text-rose border border-rose/20' : 'bg-blush/40 text-charcoal hover:bg-blush border border-transparent')}>
              <Heart size={12} className={isOnList ? 'fill-rose' : ''} />
              {isOnList ? 'Na listi' : 'Dodaj'}
            </button>
          )}
          <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium bg-sage-light/60 text-sage hover:bg-sage-light transition-colors">
            <ExternalLink size={11} /> Pogledaj
          </a>
        </div>
      </div>
    </div>
  )
}
