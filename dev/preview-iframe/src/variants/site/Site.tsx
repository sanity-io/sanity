import {stegaClean} from '@sanity/client/stega'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {type CSSProperties, type ReactNode, useMemo, useState} from 'react'

import {type Book, campaignFor, copyFor, langOf, type Parsed, parse, strings} from './model'
import './site.css'

// The Nordic Books site. One component per route; every piece of text that comes from a document keeps its
// `data-sanity` attribute, so click-to-edit opens that document and field. The audience (variant) changes the headline,
// the promo line, the campaign and, in German, the interface strings (FIXTURE copy, see model.ts); the books themselves
// come from the variant's own documents, so titles and editor's notes differ by audience as the dataset says.

export interface SiteProps {
  route: string
  books: Book[] | null
  book: Book | null
  perspective: unknown
  variant?: string
  /** Links stay inside this iframe (`?route=`), or, in a grid frame, ask the grid to change the frame's route. */
  navigate: (route: string) => string
  onNavigate?: (route: string) => void
}

const hueOf = (p: Parsed): CSSProperties => ({['--h' as string]: p.hue})

/** A typographic placeholder cover: there is no cover art in the data. Colour comes from the document id. */
function Cover({p, big}: {p: Parsed; big?: boolean}) {
  return (
    <div aria-hidden className={`cover${big ? ' big' : ''}`} style={hueOf(p)} title="Generated placeholder cover">
      <span className="t">{p.title}</span>
      <span className="a">{p.author ?? 'Nordic Books'}</span>
    </div>
  )
}

const attr = (b: Book, field: string) => createDataAttribute({id: b._id, type: b._type})(field).toString()

function BookCard({b, link}: {b: Book; link: (route: string) => ReactNode | string}) {
  const p = parse(b)
  return (
    <a className="book" href={link(`book:${b._id}`) as string} data-book={b._id}>
      <Cover p={p} />
      <div>
        <h3 data-sanity={attr(b, 'title')}>{b.title}</h3>
        <div className="by" data-sanity={attr(b, 'subtitle')}>{b.subtitle ?? ' '}</div>
        {b.badge ? <span className="badge" data-sanity={attr(b, 'badge')}>{b.badge}</span> : null}
      </div>
    </a>
  )
}

export function Site(props: SiteProps) {
  const {route, books, book, variant, perspective} = props
  const lang = langOf(variant)
  const t = strings(lang)
  const copy = copyFor(variant, lang)
  const parsed = useMemo(() => (books ?? []).map(parse), [books])
  const kind = route.startsWith('book:') ? 'book' : route
  const link = (to: string) => props.navigate(to)
  const click = (to: string) => (event: {preventDefault: () => void}) => {
    if (props.onNavigate) {
      event.preventDefault()
      props.onNavigate(to)
    }
  }
  const A = ({to, children, ...rest}: {to: string; children: ReactNode; className?: string; 'aria-current'?: 'page'}) => (
    <a {...rest} href={link(to)} onClick={click(to)}>
      {children}
    </a>
  )
  const nav: [string, string][] = [['home', t.nav.home], ['list', t.nav.list], ['campaign', t.nav.campaign], ['about', t.nav.about]]

  return (
    <div className="site" data-route={kind} lang={lang}>
      <header className="top">
        <div className="wrap">
          <A className="brand" to="home">
            <b>◐</b> Nordic Books
          </A>
          <nav aria-label="Main" className="nav">
            {nav.map(([to, label]) => (
              <A aria-current={kind === to || (to === 'list' && kind === 'book') ? 'page' : undefined} key={to} to={to}>
                {label}
              </A>
            ))}
          </nav>
          {variant ? (
            <div className="viewing" data-testid="viewing">
              {t.viewing}: <i>{copy.label}</i>
            </div>
          ) : null}
        </div>
      </header>
      {kind === 'home' ? <Home A={A} books={books} copy={copy} parsed={parsed} t={t} link={link} click={click} perspective={perspective} variant={variant} /> : null}
      {kind === 'list' ? <List books={books} parsed={parsed} t={t} link={link} /> : null}
      {kind === 'book' ? <BookPage A={A} book={book} parsed={parsed} t={t} link={link} variant={variant} copyLabel={copy.label} /> : null}
      {kind === 'campaign' ? <Campaign books={books} parsed={parsed} t={t} link={link} lang={lang} variant={variant} perspective={perspective} /> : null}
      {kind === 'about' ? <About lang={lang} /> : null}
      <footer className="foot">
        <div className="wrap">
          <span>Nordic Books · a design fixture for the Variants 2.0 test studio</span>
          <span>{(books ?? []).length} titles</span>
        </div>
      </footer>
    </div>
  )
}

type LinkFn = (route: string) => string
type AFn = (props: {to: string; children: ReactNode; className?: string}) => ReactNode

function Home(props: {A: AFn; books: Book[] | null; parsed: Parsed[]; copy: ReturnType<typeof copyFor>; t: ReturnType<typeof strings>; link: LinkFn; click: (to: string) => (e: {preventDefault: () => void}) => void; perspective: unknown; variant?: string}) {
  const {A, parsed, copy, t, link, perspective, variant} = props
  const featured = parsed.slice(0, 6)
  const campaign = campaignFor(perspective, variant, langOf(variant))
  return (
    <main>
      <section className="hero">
        <div className="wrap grid">
          <div>
            <div className="eyebrow">{copy.label === 'Everyone' ? 'Nordic Books' : copy.label}</div>
            <h1 data-testid="hero-title">{copy.hero}</h1>
            <p className="lede">{copy.promo}</p>
            <A className="btn" to="list">
              {t.catalogue} →
            </A>
          </div>
          <div aria-hidden className="stack">
            {featured.slice(0, 3).map((p) => (
              <Cover key={p.book._id} p={p} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <header>
            <h2>{t.featured}</h2>
            <A className="more" to="list">
              {t.allBooks}
            </A>
          </header>
          <div className="shelf">
            {featured.map((p) => (
              <BookCard b={p.book} key={p.book._id} link={link} />
            ))}
          </div>
        </div>
      </section>
      <section className="strip">
        <div className="wrap">
          <div>
            <div className="eyebrow" style={{color: 'inherit', opacity: 0.8}}>
              {t.campaign}
            </div>
            <h2 data-testid="strip-title">{campaign.name}</h2>
            <p>{campaign.line}</p>
          </div>
          <A className="btn" to="campaign">
            {t.campaign} →
          </A>
        </div>
      </section>
    </main>
  )
}

function List({parsed, t, link}: {books: Book[] | null; parsed: Parsed[]; t: ReturnType<typeof strings>; link: LinkFn}) {
  const [year, setYear] = useState<string | null>(null)
  const [author, setAuthor] = useState('')
  const years = [...new Set(parsed.map((p) => p.year).filter(Boolean) as string[])].sort()
  const authors = [...new Set(parsed.map((p) => p.author).filter(Boolean) as string[])].sort()
  const shown = parsed.filter((p) => (!year || p.year === year) && (!author || p.author === author))
  return (
    <main className="wrap" style={{paddingTop: 28, paddingBottom: 48}}>
      <h1 style={{fontSize: 'clamp(30px,5vw,48px)', marginBottom: 12}}>{t.catalogue}</h1>
      <div className="filters" role="group" aria-label={t.filters}>
        <div className="grp">
          <span className="lab">{t.year}</span>
          <button aria-pressed={year === null} className="chip" onClick={() => setYear(null)} type="button">
            {t.all}
          </button>
          {years.map((y) => (
            <button aria-pressed={year === y} className="chip" key={y} onClick={() => setYear(year === y ? null : y)} type="button">
              {y}
            </button>
          ))}
        </div>
        <div className="grp">
          <label htmlFor="author">{t.author}</label>
          <select className="chip" id="author" onChange={(e) => setAuthor(e.target.value)} value={author}>
            <option value="">{t.all}</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <span className="count">{shown.length} / {parsed.length}</span>
      </div>
      {shown.length ? (
        <div className="shelf" data-testid="catalogue">
          {shown.map((p) => (
            <BookCard b={p.book} key={p.book._id} link={link} />
          ))}
        </div>
      ) : (
        <p className="empty">{t.noMatch}</p>
      )}
    </main>
  )
}

function BookPage(props: {A: AFn; book: Book | null; parsed: Parsed[]; t: ReturnType<typeof strings>; link: LinkFn; variant?: string; copyLabel: string}) {
  const {A, book, parsed, t, link, variant, copyLabel} = props
  if (!book) {
    return (
      <main className="wrap">
        <p className="empty">…</p>
      </main>
    )
  }
  const p = parse(book)
  const related = parsed
    .filter((x) => x.book._id !== book._id)
    .sort((a, b) => Number(b.author === p.author && !!p.author) - Number(a.author === p.author && !!p.author) || Math.abs(Number(a.year ?? 0) - Number(p.year ?? 0)) - Math.abs(Number(b.year ?? 0) - Number(p.year ?? 0)))
    .slice(0, 4)
  return (
    <main className="wrap">
      {book.promo ? (
        <div className="promo" data-sanity={attr(book, 'promo')} data-testid="book-promo">
          {book.promo}
        </div>
      ) : null}
      <div className="crumbs">
        <A to="list">← {t.back}</A>
      </div>
      <article className="detail">
        <Cover big p={p} />
        <div>
          {book.badge ? (
            <span className="badge big" data-sanity={attr(book, 'badge')}>
              {book.badge}
            </span>
          ) : null}
          <h1 data-sanity={attr(book, 'title')}>{book.title}</h1>
          <div className="byline" data-sanity={attr(book, 'subtitle')}>{book.subtitle}</div>
          {book.blurb ? (
            <div className="notecard">
              <span className="lab">{t.note}</span>
              <p data-sanity={attr(book, 'blurb')}>{book.blurb}</p>
            </div>
          ) : null}
          {book.highlights?.length ? (
            <div className="highlights">
              <span className="lab">{t.highlights}</span>
              <ul data-sanity={attr(book, 'highlights')}>
                {book.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <button className="btn buy" data-sanity={attr(book, 'cta')} type="button">
            {book.cta ?? t.defaultCta}
          </button>
          {variant ? (
            <p className="viewing-line" data-testid="viewing-version">
              {t.viewingVersion(copyLabel)}
            </p>
          ) : null}
          <small className="visually-hidden" data-testid="served-text">{stegaClean(book.blurb ?? '')}</small>
        </div>
      </article>
      <section className="section" style={{padding: '8px 0 48px'}}>
        <header style={{display: 'flex', marginBottom: 16}}>
          <h2>{t.related}</h2>
        </header>
        <div className="shelf">
          {related.map((x) => (
            <BookCard b={x.book} key={x.book._id} link={link} />
          ))}
        </div>
      </section>
    </main>
  )
}

function Campaign(props: {books: Book[] | null; parsed: Parsed[]; t: ReturnType<typeof strings>; link: LinkFn; lang: 'en' | 'de'; variant?: string; perspective: unknown}) {
  const {parsed, t, link, lang, variant, perspective} = props
  const c = campaignFor(perspective, variant, lang)
  return (
    <main>
      <section className="campaign-hero">
        <div className="wrap">
          <span className="ribbon">{t.campaign}</span>
          <h1 data-testid="campaign-title">{c.name}</h1>
          <p className="lede" style={{fontSize: 20, color: 'var(--muted)', marginTop: 14, maxWidth: '44ch'}}>{c.line}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <header>
            <h2>{t.featured}</h2>
            <span className="count">{parsed.length}</span>
          </header>
          <div className="shelf">
            {parsed.map((p) => (
              <BookCard b={p.book} key={p.book._id} link={link} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function About({lang}: {lang: 'en' | 'de'}) {
  return (
    <main className="wrap">
      <article className="prose">
        <h1>{lang === 'de' ? 'Über Nordic Books' : 'About Nordic Books'}</h1>
        <p>
          {lang === 'de'
            ? 'Nordic Books ist ein kleiner, ausgedachter Buchladen für nordische Literatur. Er existiert, damit das Studio zeigen kann, wie dieselbe Seite für verschiedene Gruppen unterschiedlich aussieht.'
            : 'Nordic Books is a small, invented bookshop for northern writing. It exists so the studio can show how one page reads differently for different audiences.'}
        </p>
        <p>
          {lang === 'de'
            ? 'Die Bücher, Autorinnen und Jahre stammen aus dem Datensatz. Alles andere auf dieser Seite ist Entwurf.'
            : 'The books, authors and years come from the dataset. Everything else on this page is design.'}
        </p>
        <div className="placeholder-note">Fixture: this page's copy lives in the site code, not in a document.</div>
      </article>
    </main>
  )
}
