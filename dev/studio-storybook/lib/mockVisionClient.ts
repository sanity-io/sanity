/**
 * A canned-response Sanity client for the Vision tool story (`stories/tools/Vision.stories.tsx`).
 *
 * Why this exists: the Vision GUI does NOT query through the `client` prop it is handed —
 * it resolves a client from Studio context via `useClient()` and reconfigures it per
 * dataset/perspective/apiVersion, then calls `client.observable.fetch(query, params,
 * {filterResponse: false})` and reads `res.result` / `res.ms` off the response
 * (`packages/@sanity/vision/src/components/VisionGui.tsx`). `WithStudioProviders({client})`
 * feeds this client into a mock auth store, so the source's `getClient()` returns it and
 * the real "Fetch" button executes against these fixtures — fully offline, no network.
 *
 * It wraps the repo's `createMockSanityClient` (which already satisfies the whole
 * workspace-resolution surface — `config()`, `withConfig()`, bifur, listen, transactions)
 * and only patches the two seams Vision needs that the base mock does not shape:
 *   1. `observable.fetch` — returns `{result, ms}` matched to the query, with real latency
 *      so the spinner flashes and the footer timings are non-trivial.
 *   2. `getDataUrl` — the base mock omits it; VisionGui calls it to build the request URL
 *      it shows in the header / Query Recall pane.
 *
 * The fixture universe is the author/book world shared with `mockDocumentPreviewStore.ts`,
 * so content reads consistently across the Storybook.
 */
import {type SanityClient} from '@sanity/client'
import {type Observable, of} from 'rxjs'
import {delay} from 'rxjs/operators'

import {createMockSanityClient} from '../../../packages/sanity/test/mocks/mockSanityClient'

/** A book with its author dereferenced inline — the shape a typical Vision query returns. */
export interface VisionBookResult {
  _id: string
  _type: 'book'
  title: string
  year: number
  author: {_id: string; _type: 'author'; name: string; era: string}
}

/**
 * The canned result set for `*[_type == "book"]{..., author->{...}}`. Same authors as
 * the shared fixture universe (Tolstoy, Austen, Lem, Brontë, Woolf), given books so the
 * result tree has nested objects to expand and a clean tabular projection for the
 * `query-result-shaping` recommended variant.
 */
export const visionBookResults: VisionBookResult[] = [
  {
    _id: 'book-anna-karenina',
    _type: 'book',
    title: 'Anna Karenina',
    year: 1878,
    author: {_id: 'author-tolstoy', _type: 'author', name: 'Leo Tolstoy', era: 'Realism'},
  },
  {
    _id: 'book-war-and-peace',
    _type: 'book',
    title: 'War and Peace',
    year: 1869,
    author: {_id: 'author-tolstoy', _type: 'author', name: 'Leo Tolstoy', era: 'Realism'},
  },
  {
    _id: 'book-pride-and-prejudice',
    _type: 'book',
    title: 'Pride and Prejudice',
    year: 1813,
    author: {_id: 'author-austen', _type: 'author', name: 'Jane Austen', era: 'Regency'},
  },
  {
    _id: 'book-solaris',
    _type: 'book',
    title: 'Solaris',
    year: 1961,
    author: {_id: 'author-lem', _type: 'author', name: 'Stanisław Lem', era: 'Science fiction'},
  },
  {
    _id: 'book-jane-eyre',
    _type: 'book',
    title: 'Jane Eyre',
    year: 1847,
    author: {_id: 'author-bronte', _type: 'author', name: 'Charlotte Brontë', era: 'Victorian'},
  },
  {
    _id: 'book-mrs-dalloway',
    _type: 'book',
    title: 'Mrs Dalloway',
    year: 1925,
    author: {_id: 'author-woolf', _type: 'author', name: 'Virginia Woolf', era: 'Modernism'},
  },
]

/** Authors alone — returned when a query targets authors rather than books. */
export const visionAuthorResults = visionBookResults.map((book) => book.author)

/** The server-reported processing time (`res.ms`) the mock returns — small and realistic. */
const SERVER_MS = 12

/**
 * Resolve a canned result from the query text. Deliberately shallow — it recognises a
 * handful of shapes so the full-tool story stays interactive (type a count query, an
 * author query, a `[0]` selector) without pretending to be a GROQ engine.
 */
function resolveResult(query: string): unknown {
  const q = query.trim()
  if (/^count\s*\(/i.test(q)) {
    return visionBookResults.length
  }
  if (/_type\s*==\s*["']author["']/.test(q) && !/_type\s*==\s*["']book["']/.test(q)) {
    return /\[\s*0\s*\]/.test(q) ? visionAuthorResults[0] : visionAuthorResults
  }
  if (/\[\s*0\s*\]/.test(q)) {
    return visionBookResults[0]
  }
  return visionBookResults
}

export interface MockVisionClientOptions {
  /** Artificial round-trip latency, ms. Keeps the spinner and end-to-end timing real. */
  latencyMs?: number
}

/**
 * A `SanityClient`-shaped mock whose `observable.fetch` returns canned GROQ results.
 * The base mock's `withConfig()` returns the same instance, so every reconfiguration
 * VisionGui performs keeps this fetch override.
 */
export function createMockVisionClient(options: MockVisionClientOptions = {}): SanityClient {
  const {latencyMs = 180} = options
  // The base mock's typings are loose (it predates strict client types); casting to a
  // record lets us patch the two members Vision needs without dragging in the full type.
  const base = createMockSanityClient() as unknown as Record<string, unknown> & {
    config: () => {dataset?: string}
    observable: Record<string, unknown>
  }

  base.getDataUrl = (operation: string, path?: string) => {
    const dataset = base.config().dataset ?? 'production'
    return `/data/${operation}/${dataset}${path ?? ''}`
  }

  base.observable = {
    ...base.observable,
    fetch: (query: string): Observable<{result: unknown; ms: number; query: string}> =>
      of({result: resolveResult(query), ms: SERVER_MS, query}).pipe(delay(latencyMs)),
  }

  return base as unknown as SanityClient
}
