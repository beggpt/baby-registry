'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, ExternalLink, ShoppingBag } from 'lucide-react'
import { Product } from '@/types'
import clsx from 'clsx'

interface ProductCardProps {
  product: Product
  onAddToList?: (product: Product) => void
  isOnList?: boolean
  compact?: boolean
}

export default function ProductCard({ product, onAddToList, isOnList, compact }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)

  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price)

  return (
    <div className={clsx(
      'product-card bg-white rounded-3xl overflow-hidden border border-blush/30 group',
      compact ? 'flex gap-3' : 'flex flex-col'
    )}>

      {/* Slika */}
      <div className={clsx(
        'relative bg-cream overflow-hidden flex-shrink-0',
        compact ? 'w-24 h-24 rounded-2xl m-2' : 'aspect-square'
      )}>
        {product.imageUrl && !imgError ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-2"
            onError={() => setImgError(true)}
            sizes={compact ? '96px' : '(max-width: 768px) 50vw, 33vw'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-20">🍼</span>
          </div>
        )}

        {/* Badge nedostupno */}
        {!product.inStock && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-warm-gray/80 text-white text-xs rounded-full">
            Nedostupno
          </div>
        )}

        {/* Quick add button - pojavljuje se na hover */}
        {onAddToList && !compact && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-charcoal/10">
            <button
              onClick={() => onAddToList(product)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all',
                isOnList
                  ? 'bg-rose text-white'
                  : 'bg-white text-charcoal hover:bg-rose hover:text-white'
              )}
            >
              <Heart size={14} className={isOnList ? 'fill-white' : ''} />
              {isOnList ? 'Na listi' : 'Dodaj na listu'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={clsx('flex flex-col', compact ? 'flex-1 py-2 pr-3 justify-center' : 'p-4 flex-1')}>
        {product.category && !compact && (
          <span className="text-xs text-warm-gray/70 mb-1">{product.category.name}</span>
        )}

        <h3 className={clsx(
          'font-medium text-charcoal line-clamp-2 leading-snug',
          compact ? 'text-sm' : 'text-sm mb-2'
        )}>
          {product.name}
        </h3>

        {!compact && product.description && (
          <p className="text-xs text-warm-gray line-clamp-2 mb-3 flex-1">
            {product.description}
          </p>
        )}

        <div className={clsx(
          'flex items-center',
          compact ? 'mt-1' : 'mt-auto'
        )}>
          <span className={clsx(
            'font-medium text-charcoal',
            compact ? 'text-sm' : 'text-base'
          )}>
            {formattedPrice}
          </span>

          {!compact && (
            <span className="ml-2 text-xs text-warm-gray/60">{product.shopName}</span>
          )}
        </div>

        {/* Akcije */}
        <div className={clsx('flex gap-2', compact ? 'mt-2' : 'mt-3')}>
          {onAddToList && compact && (
            <button
              onClick={() => onAddToList(product)}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                isOnList
                  ? 'bg-rose/10 text-rose'
                  : 'bg-blush/50 text-charcoal hover:bg-blush'
              )}
            >
              <Heart size={11} className={isOnList ? 'fill-rose' : ''} />
              {isOnList ? 'Na listi' : 'Dodaj'}
            </button>
          )}

          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-sage-light/60 text-sage hover:bg-sage-light transition-colors"
          >
            <ExternalLink size={11} />
            {compact ? 'Shop' : 'Pogledaj u shopu'}
          </a>
        </div>
      </div>
    </div>
  )
}
