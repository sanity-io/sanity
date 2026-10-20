import {stegaClean} from '@sanity/client/stega'
import {enableVisualEditing} from '@sanity/visual-editing'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {useEffect, useRef, useState} from 'react'
import {createRoot} from 'react-dom/client'

import {useLiveMode, useQuery} from './loader'
import type {Book} from './site/model'
import {Site} from './site/Site'

// The Nordic Books site: the preview for the Presentation tool and the Presentation grid, for the Variants 2.0 test studio.
//  - Routes: `?route=home | list | campaign | about | book:<id>` (and `fm:<id>` for the field-marks document). Default: home.
//  - Every frame is independent: the route and an optional locked variant (`?variant=<id>`) come from this iframe's own
//    URL. No cookies, no shared state, so several frames can run at once.
//  - Inside Presentation, perspective and variant arrive from the Studio (`enableVisualEditing`), content arrives through
//    the loader, and every document text carries stega and `data-sanity`, so clicking it opens the right document and field.
//  - The site itself lives in ./site (model.ts holds the fixture copy and what is derived from the data).

const params = new URLSearchParams(window.location.search)
const route = params.get('route') ?? 'home' // grid frames: one route per frame (the grid changes it, not the page)
const lockedVariant = params.get('variant') ?? undefined
const gridFrame = params.get('frame')

// Every document of the shop: both book types (the dataset has `book` and the live-edit `bookLive`).
const LIST = `*[_type in ["book", "bookLive"]] | order(title asc) {_id, _type, title, subtitle, blurb, highlights, promo, badge, cta}`
const FM = `*[_type == "fieldMarksTest" && _id == $id][0] {_id, _type, title, subtitle}`
const ONE = `*[_type in ["book", "bookLive"] && _id == $id][0] {_id, _type, title, subtitle, blurb, highlights, promo, badge, cta}`

/** Where a link goes. In Presentation the iframe reloads with a new `?route=`; the locked variant (if any) is kept. */
const hrefFor = (to: string) => `?route=${encodeURIComponent(to)}${lockedVariant ? `&variant=${lockedVariant}` : ''}`

function Badge({perspective, variant, route}: {perspective: unknown; variant?: string; route: string}) {
  return (
    <div className="state" data-testid="preview-state">
      {JSON.stringify(perspective)} · variant {variant ?? 'none'} · route {route}
    </div>
  )
}

function LiveFieldMarks({id}: {id: string}) {
  const {data} = useQuery<Book | null>(FM, {id})
  if (!data) return <p style={{font: '14px system-ui'}}>Loading {id}…</p>
  const attr = createDataAttribute({id: data._id, type: data._type})
  return (
    <article>
      <h1 data-sanity={attr('title').toString()} style={{font: '600 26px system-ui'}}>{data.title}</h1>
      <h2 data-sanity={attr('subtitle').toString()} style={{font: '16px system-ui', opacity: 0.7}}>{data.subtitle}</h2>
    </article>
  )
}

/** The route of an address (`?route=`), for the first load, the browser's back button and Presentation's address bar. */
const routeOf = (search: string) => new URLSearchParams(search).get('route') ?? 'home'

function Main() {
  const [perspective, setPerspective] = useState<unknown>('published')
  const [variant, setVariant] = useState<string | undefined>(lockedVariant)
  // The site is a single page: a link changes the route without reloading, so the Presentation connection stays up.
  const [route, setRoute] = useState(routeOf(window.location.search))
  const reportNavigation = useRef<((update: {type: 'push' | 'replace' | 'pop'; url: string}) => void) | null>(null)
  const go = (to: string) => {
    const url = hrefFor(to)
    window.history.pushState({}, '', url)
    setRoute(to)
    window.scrollTo(0, 0)
    reportNavigation.current?.({type: 'push', url: window.location.pathname + url})
  }
  useEffect(() => {
    const onPop = () => setRoute(routeOf(window.location.search))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  useEffect(
    () =>
      enableVisualEditing({
        onPerspectiveChange: setPerspective as never,
        onVariantChange: (next) => setVariant(lockedVariant ?? next),
        // Tell Presentation where this page is, so its address bar follows the site, and let the address bar move the site.
        history: {
          subscribe: (navigate) => {
            reportNavigation.current = navigate
            navigate({type: 'replace', url: window.location.pathname + window.location.search})
            return () => {
              reportNavigation.current = null
            }
          },
          update: (update) => {
            if (update.type === 'pop') {
              window.history.back()
              return
            }
            const next = new URL(update.url, window.location.href)
            if (update.type === 'push') window.history.pushState({}, '', next.pathname + next.search)
            else window.history.replaceState({}, '', next.pathname + next.search)
            setRoute(routeOf(next.search))
          },
        },
      }),
    [],
  )
  useLiveMode({})
  const books = useQuery<Book[]>(LIST, {}).data ?? null
  const id = route.startsWith('book:') ? route.slice('book:'.length) : ''
  const book = useQuery<Book | null>(ONE, {id}).data ?? null
  if (route.startsWith('fm:')) {
    return (
      <main style={{margin: '0 auto', maxWidth: 720, padding: 16}}>
        <LiveFieldMarks id={route.slice(3)} />
        <Badge perspective={perspective} route={route} variant={variant} />
      </main>
    )
  }
  return (
    <>
      <Site book={route.startsWith('book:') ? book : null} books={books} navigate={hrefFor} onNavigate={go} perspective={perspective} route={route} variant={variant} />
      <Badge perspective={perspective} route={route} variant={variant} />
    </>
  )
}

// GRID MODE (spike): the Studio's "Presentation grid" tool owns one comlink channel per iframe and pushes the page's
// data with postMessage (no loader channel, no token in the page): `{list, book}` for this frame's perspective and
// variant. The visual-editing handshake still runs, so the perspective and variant arrive over this frame's own channel.
// A link inside a frame asks the grid to change the frame's route (`grid-navigate`); nothing reloads.
function GridMain() {
  const [data, setData] = useState<{list: Book[] | null; book: Book | null}>({list: null, book: null})
  const [perspective, setPerspective] = useState<unknown>('published')
  const [variant, setVariant] = useState<string | undefined>(lockedVariant)
  const [connected, setConnected] = useState(0)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'grid-data' && event.data.frame === gridFrame) setData({list: event.data.list ?? null, book: event.data.book ?? null})
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  useEffect(
    () =>
      enableVisualEditing({
        onPerspectiveChange: (next) => {
          setPerspective(next)
          setConnected((n) => n + 1)
        },
        onVariantChange: (next) => setVariant(next),
      }),
    [],
  )
  return (
    <>
      <Site
        book={route.startsWith('book:') ? data.book : null}
        books={data.list}
        navigate={hrefFor}
        onNavigate={(to) => window.parent.postMessage({type: 'grid-navigate', frame: gridFrame, route: to}, '*')}
        perspective={perspective}
        route={route}
        variant={variant}
      />
      <Badge perspective={perspective} route={route} variant={variant} />
      <span data-testid="grid-channel" hidden>{`perspective-updates=${connected}`}</span>
    </>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(params.get('mode') === 'grid' ? <GridMain /> : <Main />)
