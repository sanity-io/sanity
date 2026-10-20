import './site.css'

import {stegaClean} from '@sanity/client/stega'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'

import {
  type Book,
  campaignFor,
  copyFor,
  langOf,
  type Parsed,
  parse,
  type PtBlock,
  type Ref,
  strings,
} from './model'

// Nordic Library: a public library running a book sale. One component per route; every piece of text that comes from a
// document keeps its `data-sanity` attribute, so click-to-edit opens that document and field. Links (to authors, series,
// publishers, books) stay on elements WITHOUT `data-sanity`, so Presentation's overlays do not swallow the navigation:
// a title is click-to-edit, the cover and the name chips (author, series, publisher: stega removed from their text) navigate.
//
// Routes (`?route=`): home | list | authors | author:<id> | series | series:<id> | publisher:<id> | book:<id> | campaign | about.
// The audience (variant) changes the headline, the campaign and, in German, the interface strings (FIXTURE copy, see
// model.ts); the documents themselves come from the variant's own versions, so titles, promos and notes differ by audience.

export interface SiteProps {
  route: string
  /** What the route's query returned: a list of books (home, list, campaign), one book, one author, a list of authors, ... */
  data: unknown
  loading?: boolean
  perspective: unknown
  variant?: string
  /** Links stay inside this iframe (`?route=`), or, in a grid frame, ask the grid to change the frame's route. */
  navigate: (route: string) => string
  onNavigate?: (route: string) => void
}

type Strings = ReturnType<typeof strings>
const Ctx = createContext<{
  link: (to: string) => string
  go: (to: string) => (event: {preventDefault: () => void}) => void
  t: Strings
}>(null as never)

function L({
  to,
  children,
  ...rest
}: {
  'to': string
  'children': ReactNode
  'className'?: string
  'title'?: string
  'aria-current'?: 'page'
  'data-testid'?: string
}) {
  const {link, go} = useContext(Ctx)
  return (
    <a {...rest} href={link(to)} onClick={go(to)}>
      {children}
    </a>
  )
}

const clean = (s?: string | null) => stegaClean(s ?? '')
const hueOf = (p: Parsed): CSSProperties => ({['--h' as string]: p.hue})
const attrFor = (doc: {_id: string; _type: string}, field: string) =>
  createDataAttribute({id: doc._id, type: doc._type})(field).toString()
const nameOf = (r?: Ref | null) => r?.name ?? r?.title ?? ''
const hueFromId = (id: string) => {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h % 360
}
const initials = (name: string) =>
  clean(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/** A typographic placeholder cover: there is no cover art in the data. Colour comes from the document id. */
function Cover({p, big}: {p: Parsed; big?: boolean}) {
  return (
    <div aria-hidden className={`cover${big ? ' big' : ''}`} style={hueOf(p)}>
      <span className="t">{p.title}</span>
      <span className="a">{p.author ?? 'Nordic Library'}</span>
    </div>
  )
}

function Ribbon({b}: {b: Book}) {
  const {t} = useContext(Ctx)
  // Price-less sale tag: the book's own badge (a document field) or, without one, "On sale" when it carries a promo.
  const text = b.badge ?? (b.promo ? t.onSale : null)
  if (!text) return null
  return <span className="ribbon-tag">{text}</span>
}

function BookCard({b}: {b: Book}) {
  const {t} = useContext(Ctx)
  const p = parse(b)
  return (
    <article className="book" data-book={b._id}>
      <L className="cover-link" to={`book:${b._id}`} title={clean(b.title)}>
        <Cover p={p} />
        <Ribbon b={b} />
      </L>
      <div className="body">
        <h3 data-sanity={attrFor(b, 'title')}>
          <L to={`book:${b._id}`}>{b.title}</L>
        </h3>
        {b.author ? (
          <div className="by">
            {t.by} <L to={`author:${b.author._id}`}>{clean(b.author.name)}</L>
          </div>
        ) : (
          <div className="by" data-sanity={attrFor(b, 'subtitle')}>
            {b.subtitle ?? ' '}
          </div>
        )}
        {b.promo ? <div className="promo-line">{b.promo}</div> : null}
        <div className="chips">
          {b.series ? (
            <L className="chip-link" to={`series:${b.series._id}`}>
              {clean(b.series.title)}
            </L>
          ) : null}
          {b.publisher ? (
            <L className="chip-link alt" to={`publisher:${b.publisher._id}`}>
              {clean(b.publisher.name)}
            </L>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function Shelf({books}: {books: Book[]}) {
  return (
    <div className="shelf" data-testid="catalogue">
      {books.map((b) => (
        <BookCard b={b} key={b._id} />
      ))}
    </div>
  )
}

function Crumbs({trail}: {trail: [string, string | null][]}) {
  const {t} = useContext(Ctx)
  return (
    <nav aria-label="Breadcrumb" className="crumbs" data-testid="crumbs">
      <L to="home">{t.nav.home}</L>
      {trail.map(([label, to], i) => (
        <span key={i}>
          <i aria-hidden>›</i>
          {to ? <L to={to}>{label}</L> : <span aria-current="page">{label}</span>}
        </span>
      ))}
    </nav>
  )
}

function Status({loading, data}: {loading?: boolean; data: unknown}) {
  const {t} = useContext(Ctx)
  return (
    <main className="wrap">
      <p className="empty">{!loading && !data ? t.notFound : t.loading}</p>
    </main>
  )
}

const asList = (data: unknown): Book[] => (Array.isArray(data) ? (data as Book[]) : [])

export function Site(props: SiteProps) {
  const {route, data, variant, perspective, loading} = props
  const lang = langOf(variant)
  const t = strings(lang)
  const copy = copyFor(variant, lang)
  const kind = route.split(':')[0]
  const {onNavigate, navigate} = props
  const ctx = useMemo(
    () => ({
      link: navigate,
      go: (to: string) => (event: {preventDefault: () => void}) => {
        if (onNavigate) {
          event.preventDefault()
          onNavigate(to)
        }
      },
      t,
    }),
    [navigate, onNavigate, t],
  )
  const go = ctx.go
  const nav: [string, string, string[]][] = [
    ['home', t.nav.home, ['home']],
    ['list', t.nav.list, ['list', 'book']],
    ['authors', t.nav.authors, ['authors', 'author']],
    ['series', t.nav.series, ['series', 'publisher']],
    ['campaign', t.nav.campaign, ['campaign']],
    ['about', t.nav.about, ['about']],
  ]
  // The loader may still hold the previous route's result for a moment: accept only data of the shape this route reads.
  const routeId = route.includes(':') ? route.slice(route.indexOf(':') + 1) : ''
  const isDoc = (d: unknown) =>
    Boolean(d) && !Array.isArray(d) && (d as {_id?: string})._id === routeId
  const isList = (d: unknown, types: string[]) =>
    Array.isArray(d) && (d.length === 0 || types.includes((d[0] as {_type?: string})._type ?? ''))
  const docData = isDoc(data) ? data : null
  const books =
    (kind === 'home' || kind === 'list' || kind === 'campaign') &&
    isList(data, ['book', 'bookLive'])
      ? asList(data)
      : []
  const authorList = kind === 'authors' && isList(data, ['author']) ? (data as Ref[]) : null
  const seriesList =
    kind === 'series' && !routeId && isList(data, ['series']) ? (data as Ref[]) : null

  return (
    <Ctx.Provider value={ctx}>
      <div className="site" data-route={kind} lang={lang}>
        <header className="top">
          <div className="wrap">
            <L className="brand" to="home">
              <b>◐</b> {t.brand}
            </L>
            <nav aria-label="Main" className="nav">
              {nav.map(([to, label, kinds]) => (
                <L aria-current={kinds.includes(kind) ? 'page' : undefined} key={to} to={to}>
                  {label}
                </L>
              ))}
            </nav>
            {variant ? (
              <div className="viewing" data-testid="viewing">
                {t.viewing}: <i>{copy.label}</i>
              </div>
            ) : null}
          </div>
        </header>
        {kind === 'home' ? (
          <Home books={books} copy={copy} perspective={perspective} variant={variant} />
        ) : null}
        {kind === 'list' ? <List books={books} /> : null}
        {kind === 'book' ? (
          <BookPage
            book={docData as Book | null}
            loading={loading}
            variant={variant}
            copyLabel={copy.label}
          />
        ) : null}
        {kind === 'authors' ? <Authors authors={authorList} /> : null}
        {kind === 'author' ? <AuthorPage author={docData as Ref | null} loading={loading} /> : null}
        {kind === 'series' ? (
          route.includes(':') ? (
            <SeriesPage series={docData as Ref | null} loading={loading} />
          ) : (
            <SeriesList series={seriesList} />
          )
        ) : null}
        {kind === 'publisher' ? (
          <PublisherPage publisher={docData as Ref | null} loading={loading} />
        ) : null}
        {kind === 'campaign' ? (
          <Campaign books={books} lang={lang} perspective={perspective} variant={variant} />
        ) : null}
        {kind === 'about' ? <About lang={lang} /> : null}
        <footer className="foot">
          <div className="wrap">
            <span>{t.brand} · a design fixture for the Variants 2.0 test studio</span>
            {books.length ? (
              <span>
                {books.length} {t.books}
              </span>
            ) : null}
          </div>
        </footer>
      </div>
    </Ctx.Provider>
  )
}

// ------------------------------------------------------------------ home: the sale

function Home({
  books,
  copy,
  perspective,
  variant,
}: {
  books: Book[]
  copy: ReturnType<typeof copyFor>
  perspective: unknown
  variant?: string
}) {
  const {t} = useContext(Ctx)
  const featured = books.slice(0, 8)
  const campaign = campaignFor(perspective, variant, langOf(variant))
  const saleBook = books.find((b) => b.promo)
  return (
    <main>
      <div className="sale-bar" data-testid="sale-bar">
        <div className="wrap">
          <span className="sale-tag">{t.sale}</span>
          {saleBook ? (
            <span data-sanity={attrFor(saleBook, 'promo')}>{saleBook.promo}</span>
          ) : (
            <span>{t.saleLine}</span>
          )}
        </div>
      </div>
      <section className="hero">
        <div className="wrap grid">
          <div>
            <div className="eyebrow">
              {copy.label === 'Everyone' ? t.sale : `${t.sale} · ${copy.label}`}
            </div>
            <h1 data-testid="hero-title">{copy.hero}</h1>
            <p className="lede">{copy.promo}</p>
            <div className="actions">
              <L className="btn" to="list">
                {t.catalogue} →
              </L>
              <L className="btn ghost" to="authors">
                {t.authors}
              </L>
              <L className="btn ghost" to="series">
                {t.seriesLabel}
              </L>
            </div>
          </div>
          <div aria-hidden className="stack">
            {featured.slice(0, 3).map((b) => (
              <Cover key={b._id} p={parse(b)} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <header>
            <h2>{t.featured}</h2>
            <L className="more" to="list">
              {t.allBooks}
            </L>
          </header>
          {books.length ? <Shelf books={featured} /> : <p className="empty">{t.loading}</p>}
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
          <L className="btn" to="campaign">
            {t.campaign} →
          </L>
        </div>
      </section>
    </main>
  )
}

function List({books}: {books: Book[]}) {
  const {t} = useContext(Ctx)
  const parsed = useMemo(() => books.map(parse), [books])
  const [year, setYear] = useState<string | null>(null)
  const [author, setAuthor] = useState('')
  const years = [...new Set(parsed.map((p) => p.year).filter(Boolean) as string[])].sort()
  const authors = [...new Set(parsed.map((p) => p.author).filter(Boolean) as string[])].sort()
  const shown = parsed.filter((p) => (!year || p.year === year) && (!author || p.author === author))
  const saleBook = books.find((b) => b.promo)
  return (
    <main className="wrap" style={{paddingBottom: 48}}>
      <Crumbs trail={[[t.catalogue, null]]} />
      <h1 className="page-title">{t.catalogue}</h1>
      {saleBook ? (
        <div className="promo" data-sanity={attrFor(saleBook, 'promo')}>
          <b>{t.sale}</b> {saleBook.promo}
        </div>
      ) : null}
      <div className="filters" role="group" aria-label={t.filters}>
        <div className="grp">
          <span className="lab">{t.year}</span>
          <button
            aria-pressed={year === null}
            className="chip"
            onClick={() => setYear(null)}
            type="button"
          >
            {t.all}
          </button>
          {years.map((y) => (
            <button
              aria-pressed={year === y}
              className="chip"
              key={y}
              onClick={() => setYear(year === y ? null : y)}
              type="button"
            >
              {y}
            </button>
          ))}
        </div>
        <div className="grp">
          <label htmlFor="author">{t.author}</label>
          <select
            className="chip"
            id="author"
            onChange={(e) => setAuthor(e.target.value)}
            value={author}
          >
            <option value="">{t.all}</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <span className="count">
          {shown.length} / {parsed.length}
        </span>
      </div>
      {shown.length ? (
        <Shelf books={shown.map((p) => p.book)} />
      ) : (
        <p className="empty">{parsed.length ? t.noMatch : t.loading}</p>
      )}
    </main>
  )
}

// ------------------------------------------------------------------ book

function Notes({blocks}: {blocks: PtBlock[]}) {
  const {t} = useContext(Ctx)
  return (
    <>
      {blocks
        .filter((b) => b._type === 'block')
        .map((b, i) => {
          const Tag = (
            b.style === 'h2' || b.style === 'h3' || b.style === 'blockquote' ? b.style : 'p'
          ) as 'p'
          return (
            <Tag key={b._key ?? i}>
              {(b.children ?? []).map((c, j) => {
                if (c._type === 'authorMention') {
                  return c.author ? (
                    <L className="mention" key={c._key ?? j} to={`author:${c.author._id}`}>
                      {clean(c.author.name)}
                    </L>
                  ) : (
                    <span className="muted" key={c._key ?? j}>
                      {t.notFound}
                    </span>
                  )
                }
                const marks = c.marks ?? []
                let node: ReactNode = c.text
                if (marks.includes('strong')) node = <strong>{node}</strong>
                if (marks.includes('em')) node = <em>{node}</em>
                return <span key={c._key ?? j}>{node}</span>
              })}
            </Tag>
          )
        })}
    </>
  )
}

function BookPage({
  book,
  loading,
  variant,
  copyLabel,
}: {
  book: Book | null
  loading?: boolean
  variant?: string
  copyLabel: string
}) {
  const {t} = useContext(Ctx)
  if (!book) return <Status data={book} loading={loading} />
  const p = parse(book)
  const related = (book.related ?? []).filter((r): r is Book => Boolean(r && r._id && r.title))
  const unique = related.filter(
    (r, i) => related.findIndex((x) => x._id === r._id) === i && r._id !== book._id,
  )
  return (
    <main className="wrap">
      {book.promo ? (
        <div className="promo" data-sanity={attrFor(book, 'promo')} data-testid="book-promo">
          <b>{t.sale}</b> {book.promo}
        </div>
      ) : null}
      <Crumbs
        trail={[
          [t.catalogue, 'list'],
          [clean(book.title), null],
        ]}
      />
      <article className="detail">
        <div className="coverbox">
          <Cover big p={p} />
          <Ribbon b={book} />
        </div>
        <div>
          {book.badge ? (
            <span className="badge big" data-sanity={attrFor(book, 'badge')}>
              {book.badge}
            </span>
          ) : null}
          <h1 data-sanity={attrFor(book, 'title')}>{book.title}</h1>
          <div className="byline" data-sanity={attrFor(book, 'subtitle')}>
            {book.subtitle}
          </div>
          <dl className="facts">
            <div>
              <dt data-sanity={attrFor(book, 'author')}>{t.author}</dt>
              <dd>
                {book.author ? (
                  <L to={`author:${book.author._id}`}>{clean(book.author.name)}</L>
                ) : (
                  <span className="muted">{p.author ?? '–'}</span>
                )}
              </dd>
            </div>
            <div>
              <dt data-sanity={attrFor(book, 'inSeries')}>{t.inSeries}</dt>
              <dd>
                {book.series ? (
                  <L to={`series:${book.series._id}`}>{clean(book.series.title)}</L>
                ) : (
                  <span className="muted">–</span>
                )}
              </dd>
            </div>
            <div>
              <dt data-sanity={attrFor(book, 'publisher')}>{t.publisherLabel}</dt>
              <dd>
                {book.publisher ? (
                  <L to={`publisher:${book.publisher._id}`}>{clean(book.publisher.name)}</L>
                ) : (
                  <span className="muted">{book.publisherRef ? t.publisherPending : '–'}</span>
                )}
              </dd>
            </div>
          </dl>
          {book.blurb ? (
            <div className="notecard">
              <span className="lab">{t.note}</span>
              <p data-sanity={attrFor(book, 'blurb')}>{book.blurb}</p>
            </div>
          ) : null}
          {book.highlights?.length ? (
            <div className="highlights">
              <span className="lab">{t.highlights}</span>
              <ul data-sanity={attrFor(book, 'highlights')}>
                {book.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <button className="btn buy" data-sanity={attrFor(book, 'cta')} type="button">
            {book.cta ?? t.defaultCta}
          </button>
          {variant ? (
            <p className="viewing-line" data-testid="viewing-version">
              {t.viewingVersion(copyLabel)}
            </p>
          ) : null}
          <small className="visually-hidden" data-testid="served-text">
            {clean(book.blurb)}
          </small>
        </div>
      </article>
      {book.notes?.length ? (
        <section className="reader-notes">
          <h2 data-sanity={attrFor(book, 'notes')}>{t.readerNotes}</h2>
          <div className="pt" data-testid="notes">
            <Notes blocks={book.notes} />
          </div>
        </section>
      ) : null}
      {unique.length ? (
        <section className="section" style={{padding: '8px 0 48px'}}>
          <header style={{display: 'flex', marginBottom: 16}}>
            <h2 data-sanity={attrFor(book, 'relatedBooks')}>{t.related}</h2>
          </header>
          <div className="shelf" data-testid="related">
            {unique.map((x) => (
              <BookCard b={x} key={x._id} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

// ------------------------------------------------------------------ authors, series, publishers

function Avatar({id, name, big}: {id: string; name: string; big?: boolean}) {
  return (
    <div
      aria-hidden
      className={`avatar${big ? ' big' : ''}`}
      style={{['--h' as string]: hueFromId(id)} as CSSProperties}
    >
      {initials(name)}
    </div>
  )
}

const countLabel = (n: number, t: Strings) => `${n} ${n === 1 ? t.book : t.books}`

function Authors({authors}: {authors: Ref[] | null}) {
  const {t} = useContext(Ctx)
  return (
    <main className="wrap" style={{paddingBottom: 48}}>
      <Crumbs trail={[[t.authors, null]]} />
      <h1 className="page-title">{t.authors}</h1>
      {authors ? (
        <div className="cards" data-testid="authors">
          {[...authors]
            .sort((x, y) => Number((y.bookCount ?? 0) > 0) - Number((x.bookCount ?? 0) > 0))
            .map((a) => (
              <article className="card" key={a._id}>
                <L className="card-link" to={`author:${a._id}`} title={clean(a.name)}>
                  <Avatar id={a._id} name={a.name ?? ''} />
                </L>
                <div>
                  <h3 data-sanity={attrFor(a, 'name')}>
                    <L to={`author:${a._id}`}>{a.name}</L>
                  </h3>
                  <div className="by">
                    {[a.born ? `${t.born} ${a.born}` : '', a.town?.name ? clean(a.town.name) : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  <div className="by">{countLabel(a.bookCount ?? 0, t)}</div>
                </div>
              </article>
            ))}
        </div>
      ) : (
        <p className="empty">{t.loading}</p>
      )}
    </main>
  )
}

function AuthorPage({author, loading}: {author: Ref | null; loading?: boolean}) {
  const {t} = useContext(Ctx)
  if (!author) return <Status data={author} loading={loading} />
  const books = author.books ?? []
  return (
    <main className="wrap" style={{paddingBottom: 48}}>
      <Crumbs
        trail={[
          [t.authors, 'authors'],
          [clean(author.name), null],
        ]}
      />
      <header className="profile">
        <Avatar big id={author._id} name={author.name ?? ''} />
        <div>
          <h1 data-sanity={attrFor(author, 'name')}>{author.name}</h1>
          {author.bio ? (
            <p className="bio" data-sanity={attrFor(author, 'bio')}>
              {author.bio}
            </p>
          ) : null}
          <dl className="facts inline">
            {author.born ? (
              <div>
                <dt data-sanity={attrFor(author, 'born')}>{t.born}</dt>
                <dd>{author.born}</dd>
              </div>
            ) : null}
            <div>
              <dt data-sanity={attrFor(author, 'homeTown')}>{t.homeTown}</dt>
              <dd>
                {author.town ? (
                  [clean(author.town.name), clean(author.town.country)].filter(Boolean).join(', ')
                ) : (
                  <span className="muted">–</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </header>
      <section className="section" style={{padding: '24px 0 0'}}>
        <header style={{display: 'flex', marginBottom: 16}}>
          <h2>
            {t.booksBy} {author.name}
          </h2>
        </header>
        {books.length ? <Shelf books={books} /> : <p className="empty">{t.noBooks}</p>}
      </section>
    </main>
  )
}

function SeriesList({series}: {series: Ref[] | null}) {
  const {t} = useContext(Ctx)
  return (
    <main className="wrap" style={{paddingBottom: 48}}>
      <Crumbs trail={[[t.seriesLabel, null]]} />
      <h1 className="page-title">{t.seriesLabel}</h1>
      {series ? (
        <div className="cards wide" data-testid="series-list">
          {series.map((s) => (
            <article className="card tile" key={s._id}>
              <div>
                <h3 data-sanity={attrFor(s, 'title')}>
                  <L to={`series:${s._id}`}>{s.title}</L>
                </h3>
                {s.blurb ? <p className="blurb">{s.blurb}</p> : null}
                <div className="by">{countLabel(s.bookCount ?? 0, t)}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">{t.loading}</p>
      )}
    </main>
  )
}

function SeriesPage({series, loading}: {series: Ref | null; loading?: boolean}) {
  const {t} = useContext(Ctx)
  if (!series) return <Status data={series} loading={loading} />
  const books = series.books ?? []
  return (
    <main className="wrap" style={{paddingBottom: 48}}>
      <Crumbs
        trail={[
          [t.seriesLabel, 'series'],
          [clean(series.title), null],
        ]}
      />
      <header className="profile plain">
        <div>
          <div className="eyebrow">{t.inSeries}</div>
          <h1 data-sanity={attrFor(series, 'title')}>{series.title}</h1>
          {series.blurb ? (
            <p className="bio" data-sanity={attrFor(series, 'blurb')}>
              {series.blurb}
            </p>
          ) : null}
        </div>
      </header>
      <section className="section" style={{padding: '24px 0 0'}}>
        <header style={{display: 'flex', marginBottom: 16}}>
          <h2>{t.booksIn}</h2>
        </header>
        {books.length ? <Shelf books={books} /> : <p className="empty">{t.noBooks}</p>}
      </section>
    </main>
  )
}

function PublisherPage({publisher, loading}: {publisher: Ref | null; loading?: boolean}) {
  const {t} = useContext(Ctx)
  if (!publisher) return <Status data={publisher} loading={loading} />
  const books = publisher.books ?? []
  return (
    <main className="wrap" style={{paddingBottom: 48}}>
      <Crumbs
        trail={[
          [t.seriesLabel, 'series'],
          [clean(publisher.name), null],
        ]}
      />
      <header className="profile plain">
        <div>
          <div className="eyebrow">{t.publisherLabel}</div>
          <h1 data-sanity={attrFor(publisher, 'name')}>{publisher.name}</h1>
          {publisher.about ? (
            <p className="bio" data-sanity={attrFor(publisher, 'about')}>
              {publisher.about}
            </p>
          ) : null}
          {publisher.hq ? (
            <dl className="facts inline">
              <div>
                <dt data-sanity={attrFor(publisher, 'headquarters')}>{t.headquarters}</dt>
                <dd>
                  {[clean(publisher.hq.name), clean(publisher.hq.country)]
                    .filter(Boolean)
                    .join(', ')}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      </header>
      <section className="section" style={{padding: '24px 0 0'}}>
        <header style={{display: 'flex', marginBottom: 16}}>
          <h2>{t.booksFrom}</h2>
        </header>
        {books.length ? <Shelf books={books} /> : <p className="empty">{t.noBooks}</p>}
      </section>
    </main>
  )
}

// ------------------------------------------------------------------ campaign, about

function Campaign({
  books,
  lang,
  variant,
  perspective,
}: {
  books: Book[]
  lang: 'en' | 'de'
  variant?: string
  perspective: unknown
}) {
  const {t} = useContext(Ctx)
  const c = campaignFor(perspective, variant, lang)
  return (
    <main>
      <section className="campaign-hero">
        <div className="wrap">
          <span className="ribbon">{t.campaign}</span>
          <h1 data-testid="campaign-title">{c.name}</h1>
          <p
            className="lede"
            style={{fontSize: 20, color: 'var(--muted)', marginTop: 14, maxWidth: '44ch'}}
          >
            {c.line}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <header>
            <h2>{t.featured}</h2>
            <span className="count">{books.length}</span>
          </header>
          <Shelf books={books} />
        </div>
      </section>
    </main>
  )
}

function About({lang}: {lang: 'en' | 'de'}) {
  return (
    <main className="wrap">
      <article className="prose">
        <h1>{lang === 'de' ? 'Über die Nordische Bibliothek' : 'About Nordic Library'}</h1>
        <p>
          {lang === 'de'
            ? 'Die Nordische Bibliothek ist eine kleine, ausgedachte Bibliothek mit Bücherverkauf. Sie existiert, damit das Studio zeigen kann, wie dieselbe Seite für verschiedene Gruppen unterschiedlich aussieht.'
            : 'Nordic Library is a small, invented public library running a book sale. It exists so the studio can show how one page reads differently for different audiences.'}
        </p>
        <p>
          {lang === 'de'
            ? 'Die Bücher, Autorinnen, Reihen und Verlage stammen aus dem Datensatz. Alles andere auf dieser Seite ist Entwurf.'
            : 'The books, authors, series and publishers come from the dataset. Everything else on this page is design.'}
        </p>
        <div className="placeholder-note">
          Fixture: this page's copy lives in the site code, not in a document.
        </div>
      </article>
    </main>
  )
}
