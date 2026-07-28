import {PortableText, type PortableTextComponents} from '@portabletext/react'
import {type PortableTextBlock} from '@sanity/types'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {useState} from 'react'
import {Link} from 'react-router-dom'

import {type CoffeeProductCard, type ProductSizeOption} from './queries'
import {useUiStrings} from './uiStrings'

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

export function ProductOptions({
  sizeOptions,
  grindOptions,
  sizeIndex,
  onSizeChange,
  grind,
  onGrindChange,
}: {
  sizeOptions?: ProductSizeOption[]
  grindOptions?: string[]
  sizeIndex: number
  onSizeChange: (index: number) => void
  grind?: string
  onGrindChange: (grind: string) => void
}) {
  const t = useUiStrings()
  if (!sizeOptions?.length && !grindOptions?.length) return null

  return (
    <div className="product-options">
      {sizeOptions?.length ? (
        <div className="product-options-group">
          <span className="product-options-label">{t.sizeLabel}</span>
          <div className="product-options-pills">
            {sizeOptions.map((option, index) => (
              <button
                key={option.label ?? index}
                type="button"
                className={index === sizeIndex ? 'pill pill-selected' : 'pill'}
                onClick={() => onSizeChange(index)}
              >
                {option.label}
                {option.weightGrams ? ` (${option.weightGrams}g)` : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {grindOptions?.length ? (
        <div className="product-options-group">
          <span className="product-options-label">{t.grindLabel}</span>
          <div className="product-options-pills">
            {grindOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={option === grind ? 'pill pill-selected' : 'pill'}
                onClick={() => onGrindChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ProductCard({product}: {product: CoffeeProductCard}) {
  const t = useUiStrings()
  const attr = createDataAttribute({
    id: product._id,
    type: 'demoCoffeeProduct',
    path: 'title',
  }).toString()

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
            ? t.originFrom(product.origin.name, product.origin.region)
            : t.originUnknown}
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
  const t = useUiStrings()
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark">Brew & Bean</span>
        <span className="brand-badge">{t.brandBadge}</span>
      </Link>
      <nav>
        <Link to="/">{t.navHome}</Link>
      </nav>
    </header>
  )
}

export type DemoVariantGroup =
  | 'Baseline'
  | 'Personalization'
  | 'A/B testing'
  | 'Feature flag'
  | 'Product variant (alt.)'

export interface DemoVariantOption {
  value: string
  label: string
  group: DemoVariantGroup
}

export const DEMO_VARIANT_OPTIONS: DemoVariantOption[] = [
  {value: '', label: 'New visitor (baseline)', group: 'Baseline'},
  {value: 'pernl-returning', label: 'Returning visitor', group: 'Personalization'},
  {value: 'pernl-vip', label: 'VIP / loyalty member', group: 'Personalization'},
  {value: 'pernl-local', label: 'Local regular (pickup)', group: 'Personalization'},
  {value: 'exprm-hero-treatment-b', label: 'Treatment B', group: 'A/B testing'},
  {value: 'fflag-early-access', label: 'Early access (on)', group: 'Feature flag'},
  {
    value: 'prdvr-size-small',
    label: 'Espresso — 250g (as a variant)',
    group: 'Product variant (alt.)',
  },
  {
    value: 'prdvr-size-large',
    label: 'Espresso — 1kg (as a variant)',
    group: 'Product variant (alt.)',
  },
]

const GROUP_STYLE: Record<DemoVariantGroup, {bg: string; fg: string; icon: string}> = {
  'Baseline': {bg: '#3a3530', fg: '#cbb994', icon: '⚪️'},
  'Personalization': {bg: '#1f5c3f', fg: '#c9f2dd', icon: '👤'},
  'A/B testing': {bg: '#1c4a8a', fg: '#cfe3ff', icon: '🧪'},
  'Feature flag': {bg: '#b64a1c', fg: '#ffe6d4', icon: '🚩'},
  'Product variant (alt.)': {bg: '#6b2f8a', fg: '#eeddfa', icon: '🔀'},
}

export function DemoVariantBadge({group}: {group: DemoVariantGroup}) {
  const style = GROUP_STYLE[group]
  return (
    <span className="demo-variant-badge" style={{background: style.bg, color: style.fg}}>
      <span aria-hidden>{style.icon}</span> {group}
    </span>
  )
}

export function DemoVariantSwitcher({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const groups = Array.from(new Set(DEMO_VARIANT_OPTIONS.map((o) => o.group)))
  const current = DEMO_VARIANT_OPTIONS.find((o) => o.value === value)

  return (
    <div className="demo-variant-switcher">
      <label htmlFor="demo-variant-select">Viewing as</label>
      <select id="demo-variant-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {DEMO_VARIANT_OPTIONS.filter((o) => o.group === group).map((option) => (
              <option key={option.value || 'baseline'} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {current && <DemoVariantBadge group={current.group} />}
    </div>
  )
}

const LANGUAGE_OPTIONS = [
  {value: 'en', label: '🇬🇧 English'},
  {value: 'de', label: '🇩🇪 German'},
  {value: 'fr', label: '🇫🇷 French'},
]

export function DemoLanguageSwitcher({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="demo-language-switcher">
      <label htmlFor="demo-language-select">Language</label>
      <select id="demo-language-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function DemoControlsMenu({
  showSwitcher,
  onToggleSwitcher,
  showDebug,
  onToggleDebug,
}: {
  showSwitcher: boolean
  onToggleSwitcher: (value: boolean) => void
  showDebug: boolean
  onToggleDebug: (value: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="demo-controls-menu">
      <button
        type="button"
        className="demo-controls-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        ⚙ Demo controls
      </button>
      {open && (
        <div className="demo-controls-menu-panel">
          <label>
            <input
              type="checkbox"
              checked={showSwitcher}
              onChange={(e) => onToggleSwitcher(e.target.checked)}
            />
            Viewing as bar
          </label>
          <label>
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => onToggleDebug(e.target.checked)}
            />
            Debug panel
          </label>
        </div>
      )}
    </div>
  )
}

export function DemoDebugPanel({
  requestOptions,
  response,
}: {
  requestOptions: Record<string, unknown>
  response: unknown
}) {
  return (
    <div className="demo-debug-panel">
      <div className="demo-debug-section">
        <h3>Request options sent to client.fetch()</h3>
        <pre>{JSON.stringify(requestOptions, null, 2)}</pre>
      </div>
      <div className="demo-debug-section">
        <h3>Raw query response</h3>
        <pre>{JSON.stringify(response, null, 2) ?? 'undefined'}</pre>
      </div>
    </div>
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
  const t = useUiStrings()
  return (
    <div className="state-block error">
      <p>
        <strong>{t.queryFailed}</strong>
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
