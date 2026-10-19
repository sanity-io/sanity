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

function List() {
  const {data} = useQuery<Book[]>(LIST, {})
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

function BookPage({id}: {id: string}) {
  const {data} = useQuery<Book | null>(ONE, {id})
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
      {route.startsWith('book:') ? <BookPage id={route.slice('book:'.length)} /> : <List />}
      <Badge perspective={perspective} variant={variant} />
    </main>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(<Main />)
