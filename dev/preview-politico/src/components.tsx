import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {useState} from 'react'
import {Link} from 'react-router-dom'

import {type ArticleCard as ArticleCardData} from './queries'
import {useUiStrings} from './uiStrings'

export function CoverImage({
  imageUrl,
  title,
  variant = 'card',
}: {
  imageUrl?: string
  title?: string
  variant?: 'card' | 'hero'
}) {
  if (imageUrl) {
    const width = variant === 'hero' ? 1600 : 800
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
      <span>📰</span>
    </div>
  )
}

export function ArticleCard({article}: {article: ArticleCardData}) {
  const attr = createDataAttribute({
    id: article._id,
    type: 'politicoArticle',
    path: 'headline',
  }).toString()

  const content = (
    <>
      <CoverImage imageUrl={article.imageUrl} title={article.headline} />
      <div className="article-card-body">
        {article.section && <span className="section-tag">{article.section}</span>}
        {article.kicker && <p className="kicker">{article.kicker}</p>}
        <h3>{article.headline || 'Untitled'}</h3>
        {article.dek && <p className="muted">{article.dek}</p>}
        {article.byline && <p className="byline">{article.byline}</p>}
      </div>
    </>
  )

  if (!article.slug) {
    return (
      <article className="article-card" data-sanity={attr}>
        {content}
      </article>
    )
  }

  return (
    <Link className="article-card" to={`/story/${article.slug}`} data-sanity={attr}>
      {content}
    </Link>
  )
}

export function SiteHeader() {
  const t = useUiStrings()
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark">POLITICO</span>
        <span className="brand-badge">{t.brandBadge}</span>
      </Link>
      <nav>
        <Link to="/">{t.navHome}</Link>
      </nav>
    </header>
  )
}

export type DemoVariantGroup = 'Baseline' | 'Personalization' | 'A/B testing'

export interface DemoVariantOption {
  value: string
  label: string
  group: DemoVariantGroup
}

export const DEMO_VARIANT_OPTIONS: DemoVariantOption[] = [
  {value: '', label: 'UK/EU baseline (new visitor)', group: 'Baseline'},
  {value: 'pol-pernl-us', label: 'US reader (added context)', group: 'Personalization'},
  {value: 'pol-pernl-es', label: 'Spain reader (regional framing)', group: 'Personalization'},
  {value: 'pol-pernl-pro', label: 'Pro subscriber (analysis unlocked)', group: 'Personalization'},
  {value: 'pol-exprm-headline-b', label: 'Headline — Treatment B', group: 'A/B testing'},
  {value: 'pol-exprm-headline-c', label: 'Headline — Treatment C', group: 'A/B testing'},
  {value: 'pol-exprm-sponsor-on', label: 'Sponsored insert — on', group: 'A/B testing'},
]

const GROUP_STYLE: Record<DemoVariantGroup, {bg: string; fg: string; icon: string}> = {
  'Baseline': {bg: '#2a2a2a', fg: '#d8d8d8', icon: '⚪️'},
  'Personalization': {bg: '#7a1f1f', fg: '#ffd9d9', icon: '👤'},
  'A/B testing': {bg: '#1c3a6a', fg: '#cfe3ff', icon: '🧪'},
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
  {value: 'fr', label: '🇫🇷 French'},
  {value: 'es', label: '🇪🇸 Spanish'},
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
  query,
  params,
  requestOptions,
  response,
}: {
  query: string
  params: Record<string, unknown>
  requestOptions: Record<string, unknown>
  response: unknown
}) {
  return (
    <div className="demo-debug-panel">
      <div className="demo-debug-section">
        <h3>GROQ query</h3>
        <pre>{query}</pre>
      </div>
      <div className="demo-debug-section">
        <h3>Params</h3>
        <pre>{JSON.stringify(params, null, 2)}</pre>
      </div>
      <div className="demo-debug-section">
        <h3>Options sent to client.fetch()</h3>
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
