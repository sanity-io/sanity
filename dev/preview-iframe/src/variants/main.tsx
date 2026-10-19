import {stegaClean} from '@sanity/client/stega'
import {enableVisualEditing} from '@sanity/visual-editing'
import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
import {useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'

import {useLiveMode, useQuery} from './loader'

// A stand-in preview for the Presentation tool, for the Variants 2.0 test studio.
//  - Every frame is independent: the route (`?route=list` or `?route=book:<id>`) and an optional locked variant
//    (`?variant=<id>`) come from this iframe's own URL. No cookies, no shared state, so several frames can run at once.
//  - Inside Presentation, perspective and variant arrive from the Studio (`enableVisualEditing`), content arrives
//    through the loader, and every text field carries stega so clicking it opens the right document and field.
//  - Fixture: the Nordic Books documents (title, subtitle, blurb).

interface Book {
  _id: string
  _type: string
  title?: string
  subtitle?: string
  blurb?: string
}

const params = new URLSearchParams(window.location.search)
const route = params.get('route') ?? 'list'
const lockedVariant = params.get('variant') ?? undefined

const LIST = `*[_type == "book"] | order(title asc) {_id, _type, title, subtitle}`
const FM = `*[_type == "fieldMarksTest" && _id == $id][0] {_id, _type, title, subtitle}`
const ONE = `*[_type == "book" && _id == $id][0] {_id, _type, title, subtitle, blurb}`

const card: React.CSSProperties = {border: '1px solid #ccc', borderRadius: 8, margin: '0 0 12px', padding: 16}

function Badge({perspective, variant}: {perspective: unknown; variant?: string}) {
  return (
    <div
      data-testid="preview-state"
      style={{background: '#111', borderRadius: 999, bottom: 8, color: '#fff', font: '12px system-ui', left: 8, padding: '4px 10px', position: 'fixed'}}
    >
      {JSON.stringify(perspective)} · variant {variant ?? 'none'} · route {route}
    </div>
  )
}

function List({data}: {data: Book[] | null}) {
  return (
    <div>
      <h1 style={{font: '600 22px system-ui'}}>Nordic Books</h1>
      {(data ?? []).map((book) => {
        const attr = createDataAttribute({id: book._id, type: book._type})
        return (
          <a data-sanity={attr('title').toString()} href={`?route=book:${book._id}${lockedVariant ? `&variant=${lockedVariant}` : ''}`} key={book._id} style={{...card, color: 'inherit', display: 'block', textDecoration: 'none'}}>
            <div style={{font: '600 16px system-ui'}}>{book.title}</div>
            <div style={{font: '14px system-ui', opacity: 0.7}}>{book.subtitle}</div>
          </a>
        )
      })}
    </div>
  )
}

function BookPage({id, data}: {id: string; data: Book | null}) {
  if (!data) return <p style={{font: '14px system-ui'}}>Loading {id}…</p>
  const attr = createDataAttribute({id: data._id, type: data._type})
  return (
    <article>
      <a href={`?route=list${lockedVariant ? `&variant=${lockedVariant}` : ''}`} style={{font: '13px system-ui'}}>
        ← All books
      </a>
      <h1 data-sanity={attr('title').toString()} style={{font: '600 26px system-ui'}}>{data.title}</h1>
      <h2 data-sanity={attr('subtitle').toString()} style={{font: '16px system-ui', opacity: 0.7}}>{data.subtitle}</h2>
      <p data-sanity={attr('blurb').toString()} style={{font: '15px system-ui'}}>{data.blurb}</p>
      <small data-testid="served-text">{stegaClean(data.blurb ?? '')}</small>
    </article>
  )
}

function LiveList() {
  return <List data={useQuery<Book[]>(LIST, {}).data ?? null} />
}
function LiveBook({id}: {id: string}) {
  return <BookPage data={useQuery<Book | null>(ONE, {id}).data ?? null} id={id} />
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

function Main() {
  const [perspective, setPerspective] = useState<unknown>('published')
  const [variant, setVariant] = useState<string | undefined>(lockedVariant)
  useEffect(
    () =>
      enableVisualEditing({
        onPerspectiveChange: setPerspective as never,
        onVariantChange: (next) => setVariant(lockedVariant ?? next),
      }),
    [],
  )
  useLiveMode({})
  return (
    <main style={{margin: '0 auto', maxWidth: 720, padding: 16}}>
      {route.startsWith('fm:') ? <LiveFieldMarks id={route.slice(3)} /> : route.startsWith('book:') ? <LiveBook id={route.slice('book:'.length)} /> : <LiveList />}
      <Badge perspective={perspective} variant={variant} />
    </main>
  )
}

// GRID MODE (spike): the Studio's "Presentation grid" tool owns one comlink channel per iframe and pushes the page's
// data with postMessage (no loader channel, no token in the page). The visual-editing handshake still runs, so the
// perspective and variant arrive over this frame's own channel.
function GridMain() {
  const [data, setData] = useState<Book | Book[] | null>(null)
  const [perspective, setPerspective] = useState<unknown>('published')
  const [variant, setVariant] = useState<string | undefined>(lockedVariant)
  const [connected, setConnected] = useState(0)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'grid-data' && event.data.frame === params.get('frame')) setData(event.data.data)
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
    <main style={{margin: '0 auto', maxWidth: 720, padding: 12}}>
      {route.startsWith('book:') ? <BookPage data={data as Book | null} id={route.slice('book:'.length)} /> : <List data={data as Book[] | null} />}
      <Badge perspective={perspective} variant={variant} />
      <span data-testid="grid-channel" hidden>{`perspective-updates=${connected}`}</span>
    </main>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(params.get('mode') === 'grid' ? <GridMain /> : <Main />)
