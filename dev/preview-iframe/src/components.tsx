import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {type PortableTextBlock} from '@sanity/types'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {Link} from 'react-router-dom'

import {type CoffeeProductCard} from './queries'

export function formatPrice(
  price?: number,
  discount?: number,
): {sale: string; list?: string} | null {
  if (typeof price !== 'number') return null
  const hasDiscount = typeof discount === 'number' && discount > 0
  const sale = hasDiscount ? price * (1 - discount / 100) : price
  return {
    sale: `$${sale.toFixed(2)}`,
    list: hasDiscount ? `$${price.toFixed(2)}` : undefined,
  }
}

export function ProductPrice({
  price,
  discount,
  className,
}: {
  price?: number
  discount?: number
  className?: string
}) {
  const formatted = formatPrice(price, discount)
  if (!formatted) return null
  return (
    <span className={className}>
      <strong>{formatted.sale}</strong>
      {formatted.list && <s className="price-list">{formatted.list}</s>}
    </span>
  )
}

export function CoverImage({
  imageUrl,
  title,
  variant = 'card',
}: {
  imageUrl?: string
  title?: string
  variant?: 'card' | 'hero' | 'detail'
}) {
  if (imageUrl) {
    const width = variant === 'detail' ? 1400 : variant === 'hero' ? 1600 : 800
    return (
      <img
        className={`cover cover-${variant}`}
        src={`${imageUrl}?w=${width}&fit=crop&auto=format`}
        alt={title || ''}
      />
    )
  }

  return (
    <div className={`cover cover-${variant} cover-placeholder`} aria-hidden>
      <span>☕</span>
    </div>
  )
}

export function ProductCard({product}: {product: CoffeeProductCard}) {
  const attr = createDataAttribute({id: product._id, type: 'demoCoffeeProduct'}).toString()

  const content = (
    <>
      <CoverImage imageUrl={product.imageUrl} title={product.title} />
      <div className="product-card-body">
        <div className="product-card-meta">
          {typeof product.discount === 'number' && product.discount > 0 && (
            <span className="badge">{product.discount}% off</span>
          )}
          <ProductPrice price={product.price} discount={product.discount} />
        </div>
        <h3>{product.title || 'Untitled'}</h3>
        {product.excerpt && <p className="muted">{product.excerpt}</p>}
        <p className="muted small">
          {product.origin?.name
            ? `From ${product.origin.name}${product.origin.region ? `, ${product.origin.region}` : ''}`
            : 'Origin unknown'}
        </p>
      </div>
    </>
  )

  if (!product.slug) {
    return (
      <article className="product-card" data-sanity={attr}>
        {content}
      </article>
    )
  }

  return (
    <Link className="product-card" to={`/products/${product.slug}`} data-sanity={attr}>
      {content}
    </Link>
  )
}

const richTextComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => <p>{children}</p>,
    h2: ({children}) => <h2>{children}</h2>,
    h3: ({children}) => <h3>{children}</h3>,
  },
}

export function RichText({value}: {value?: PortableTextBlock[]}) {
  if (!value?.length) return null
  return (
    <div className="prose">
      <PortableText value={value} components={richTextComponents} />
    </div>
  )
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark">Brew & Bean</span>
        <span className="brand-badge">demo shop</span>
      </Link>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </header>
  )
}

export function LoadingBlock() {
  return (
    <div className="state-block">
      <div className="spinner" />
    </div>
  )
}

export function ErrorBlock({message}: {message: string}) {
  return (
    <div className="state-block error">
      <p>
        <strong>Query failed</strong>
      </p>
      <p>{message}</p>
    </div>
  )
}

export function EmptyBlock({message}: {message: string}) {
  return (
    <div className="state-block empty">
      <p>{message}</p>
    </div>
  )
}

export function queryErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}
