/**
 * Document previews: the rows of document lists, and referenced documents fetched in batches
 * (every preview asked for in the same tick goes out as one query).
 */
import {useSyncExternalStore} from 'react'

import {assetUrl, client} from './client'
import {type Perspective} from './perspective'
import {schema} from './schema'
import {Atom} from './state'
import * as store from './store'
import {
  draftId,
  isObject,
  type JsonObject,
  prefixLast,
  previewText,
  publishedId,
  sleep,
} from './util'

export interface DocPreview {
  /** The published id, also for documents that only exist as a draft. */
  id: string
  typeName: string
  title?: string
  subtitle?: string
  /** An image asset reference. */
  media?: string
  updatedAt?: string
  /** The draft is what the preview shows, ie there are unpublished changes. */
  draft: boolean
}

/** Reads a document projected with `Schema.previewProjection` in the `drafts` perspective. */
export function previewFromProjection(value: unknown): DocPreview | undefined {
  if (!isObject(value) || typeof value._id !== 'string') return undefined
  const text = (key: string) =>
    typeof value[key] === 'string' ? (value[key] as string) : undefined
  return {
    id: publishedId(value._id),
    typeName: text('_type') ?? '',
    title: previewText(value.title),
    subtitle: previewText(value.subtitle),
    media: text('media'),
    updatedAt: text('_updatedAt'),
    draft: (text('_originalId') ?? '').startsWith('drafts.'),
  }
}

/** The preview of a document the store holds, from its current local version, so lists and
 * headers follow edits as they are typed. */
export function previewFromDocument(id: string, doc: JsonObject, draft: boolean): DocPreview {
  const typeName = typeof doc._type === 'string' ? doc._type : ''
  const preview = schema().preview(typeName)
  const field = (name: string | undefined) => (name ? doc[name] : undefined)
  const media = field(preview.media)
  const asset = isObject(media) && isObject(media.asset) ? media.asset._ref : undefined
  return {
    id,
    typeName,
    title: previewText(field(preview.title)),
    subtitle: previewText(field(preview.subtitle)),
    media: typeof asset === 'string' ? asset : undefined,
    updatedAt: typeof doc._updatedAt === 'string' ? doc._updatedAt : undefined,
    draft,
  }
}

/** The preview of `id` from the store when it holds the document, as `perspective` shows it. */
export function localPreview(id: string, perspective: Perspective): DocPreview | undefined {
  if (!store.isLoaded(draftId(id)) && !store.isLoaded(id)) return undefined
  const doc = store.shown(id, perspective)
  if (!doc) return undefined
  return previewFromDocument(id, doc, doc._id !== id)
}

export type PreviewState =
  | {type: 'loading'}
  | {type: 'missing'}
  /** The query kept failing, eg while offline. */
  | {type: 'failed'}
  | {type: 'ready'; preview: DocPreview}

/** How often a failed preview query is retried, a second apart and then doubling, before its
 * previews show as failed. */
const PREVIEW_RETRIES = 3

const cache = new Map<string, Atom<PreviewState>>()
let pending: string[] = []
let scheduled = false

/** The preview of a referenced document, fetched once and cached for the session. One whose
 * fetch failed is fetched again when it is asked for again. */
export function preview(id: string): Atom<PreviewState> {
  const published = publishedId(id)
  const cached = cache.get(published)
  if (cached && cached.get().type !== 'failed') return cached
  // A failed preview keeps showing as failed until the new query settles, since this runs
  // while rendering.
  const atom = cached ?? new Atom<PreviewState>({type: 'loading'})
  cache.set(published, atom)
  pending.push(published)
  if (!scheduled) {
    scheduled = true
    queueMicrotask(() => void fetchPending())
  }
  return atom
}

const LOADING: PreviewState = {type: 'loading'}
const noop = () => () => undefined

export function usePreview(id: string | undefined): PreviewState {
  const atom = id ? preview(id) : undefined
  return useSyncExternalStore(atom ? atom.subscribe : noop, atom ? atom.get : () => LOADING)
}

async function fetchPending(): Promise<void> {
  scheduled = false
  const ids = pending
  pending = []
  if (ids.length === 0) return
  const types = schema().documentTypes.map((def) => def.name)
  const groq = `*[_id in $ids]${schema().previewProjection(types)}`
  let result: unknown[] | undefined
  for (let attempt = 0; ; attempt++) {
    try {
      result = await client().fetch<unknown[]>(
        groq,
        {ids},
        {perspective: 'drafts', tag: 'preview.references'},
      )
      break
    } catch {
      if (attempt >= PREVIEW_RETRIES) break
      await sleep(1000 << attempt)
    }
  }
  const found = new Map<string, DocPreview>()
  for (const item of result ?? []) {
    const value = previewFromProjection(item)
    if (value) found.set(value.id, value)
  }
  for (const id of ids) {
    const atom = cache.get(id)
    if (!atom) continue
    if (!result) atom.set({type: 'failed'})
    else {
      const value = found.get(id)
      atom.set(value ? {type: 'ready', preview: value} : {type: 'missing'})
    }
  }
}

/**
 * Searches documents of `types` like the JS studio's `groq2024` strategy: any text field
 * matches through the search index, and a match in the preview title ranks higher. An empty
 * `text` lists the most recently edited documents.
 */
export async function search(types: string[], text: string, limit: number): Promise<DocPreview[]> {
  const trimmed = text.trim()
  const projection = schema().previewProjection(types)
  const params: Record<string, unknown> = {types}
  let groq: string
  if (!trimmed) {
    groq = `*[_type in $types] | order(_updatedAt desc) [0...${limit}] ${projection}`
  } else {
    params.q = prefixLast(trimmed)
    params.raw = trimmed
    const boosts = schema()
      .titleFields(types)
      .map(
        ([field, names]) =>
          `boost(_type in ${JSON.stringify(names)} && ${field} match text::query($q), 10)`,
      )
    const base = '([@, _id] match text::query($q) || _id in string::split($raw, "/"))'
    groq = `*[_type in $types] | score(${[...boosts, base].join(', ')}) [_score > 0] | order(_score desc, _updatedAt desc) [0...${limit}] ${projection}`
  }
  const result = await client().fetch<unknown[]>(groq, params, {
    perspective: 'drafts',
    tag: 'search',
  })
  return (result ?? []).flatMap((item) => previewFromProjection(item) ?? [])
}

/** Which of `ids` exist in the dataset, so for published ids, which documents are published. */
export async function existingIds(ids: string[]): Promise<Set<string>> {
  const result = await client().fetch<string[]>(
    '*[_id in $ids]._id',
    {ids},
    {perspective: 'raw', tag: 'reference.published'},
  )
  return new Set(result ?? [])
}

/** A CDN URL of an image asset cropped to a `size` × `size` square. */
export function imageUrl(assetRef: string, size: number): string | undefined {
  return imageUrlWith(assetRef, `w=${size}&h=${size}&fit=crop`)
}

/** A CDN URL of an image asset with image pipeline parameters, eg `h=400&fit=max`. */
export function imageUrlWith(assetRef: string, params: string): string | undefined {
  const url = assetUrl(assetRef)
  return url ? `${url}?${params}&auto=format` : undefined
}
