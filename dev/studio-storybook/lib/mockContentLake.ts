import {type SanityClient} from '@sanity/client'
import {evaluate, parse} from 'groq-js'
import {defer, from, Observable, of, throwError} from 'rxjs'
import {delay as delayOp} from 'rxjs/operators'

import {createMockSanityClient} from '../../../packages/sanity/test/mocks/mockSanityClient'

/**
 * A mock Content Lake: a Sanity client whose GROQ queries are really evaluated, in the browser,
 * against an in-memory set of fixture documents.
 *
 * Why this exists. The stock storybook client answers `observable.fetch` with `of(null)`, so every
 * data-backed surface can only ever be storied in its empty state. Studio search is the surface
 * where that matters most: it is not a component but a small application - type a query, watch a
 * reducer drive a real GROQ execution, get ranked hits back - and a search box that cannot return
 * a result teaches nothing about it. Backing the client with `groq-js` (the same GROQ
 * implementation Sanity ships) makes the whole loop honest offline: the query the studio builds is
 * the query that runs, and the hits come out of the fixtures by real matching rules.
 *
 * Two adjustments are needed to get there, both documented at their call sites below: parametrized
 * slices, and Content Lake's implicit draft handling.
 */

/**
 * groq-js requires slice bounds to be constant numbers, but the studio's search query ends in
 * `[0...$__limit]`. So `parse()` throws `slicing must use constant numbers` on a query the studio
 * itself generates - i.e. Sanity's own GROQ implementation cannot parse Sanity's own search query.
 * (Recorded as an upstream finding; it is a real constraint on anyone testing search offline.)
 *
 * We inline numeric params inside slice brackets before parsing. Only slices are touched, so the
 * query is otherwise executed exactly as written.
 */
function inlineSliceParams(query: string, params: Record<string, unknown>): string {
  return query.replace(
    /\[(\s*[\d$\w.]*)\s*(\.\.\.?)\s*\$(\w+)\s*\]/g,
    (match, start, dots, name) => {
      const value = params[name]
      return typeof value === 'number' ? `[${String(start).trim() || '0'}${dots}${value}]` : match
    },
  )
}

/**
 * The Content Lake resolves drafts server-side: a query for `*[_type == "article"]` returns the
 * draft's content for documents the current user has in progress, and `_originalId` carries the
 * real (draft-prefixed) id. groq-js just evaluates over whatever array we hand it, so we do that
 * overlay ourselves: a `drafts.` document replaces its published counterpart, keeps the published
 * `_id` (which is what the studio's projections and links expect), and records `_originalId`.
 *
 * Without this, a fixture set containing both a published doc and its draft returns both, and the
 * search results list shows the same document twice - which is exactly the bug the real API's
 * draft handling exists to prevent.
 */
function applyDraftPerspective(documents: SanityDocumentLike[]): SanityDocumentLike[] {
  const drafts = new Map<string, SanityDocumentLike>()
  for (const doc of documents) {
    if (doc._id.startsWith('drafts.')) drafts.set(doc._id.slice('drafts.'.length), doc)
  }
  const out: SanityDocumentLike[] = []
  for (const doc of documents) {
    if (doc._id.startsWith('drafts.')) continue
    const draft = drafts.get(doc._id)
    out.push(
      draft ? {...draft, _id: doc._id, _originalId: draft._id} : {...doc, _originalId: doc._id},
    )
  }
  // drafts with no published counterpart are new documents; they still appear
  for (const [publishedId, draft] of drafts) {
    if (!documents.some((d) => d._id === publishedId)) {
      out.push({...draft, _id: publishedId, _originalId: draft._id})
    }
  }
  return out
}

/** A fixture document. Anything else on it is passed through to GROQ untouched. */
export interface SanityDocumentLike {
  _id: string
  _type: string
  _originalId?: string
  [key: string]: unknown
}

export interface MockContentLakeOptions {
  /** The fixture dataset every query is evaluated against. */
  documents: SanityDocumentLike[]
  /**
   * Artificial latency in ms before results resolve. A small delay is worth keeping: it is what
   * makes the loading state of a search story real rather than theoretical.
   */
  delay?: number
  /**
   * Make every query fail, to story the error state. The message surfaces wherever the consuming
   * component renders query errors.
   */
  failWith?: string
  /** Called with each executed query, for stories that want to display the GROQ being run. */
  onQuery?: (query: string, params: Record<string, unknown>) => void
}

/**
 * Build a client backed by {@link MockContentLakeOptions.documents}. Everything except GROQ
 * execution is delegated to the existing storybook mock client, so auth, request(), listen(), and
 * the transaction surface behave exactly as other stories already expect.
 */
export function createMockContentLakeClient(options: MockContentLakeOptions): SanityClient {
  const {documents, delay = 220, failWith, onQuery} = options
  const base = createMockSanityClient() as unknown as SanityClient
  const dataset = applyDraftPerspective(documents)

  function run(query: string, params: Record<string, unknown> = {}): Observable<unknown> {
    onQuery?.(query, params)
    if (failWith) return throwError(() => new Error(failWith))
    const exec = defer(() =>
      from(
        (async () => {
          try {
            const tree = parse(inlineSliceParams(query, params))
            const result = await evaluate(tree, {dataset, params})
            return await result.get()
          } catch (err) {
            // Consumers (useSearch among them) swallow query errors into a generic "something
            // went wrong" state, which makes a harness bug indistinguishable from a deliberate
            // error story. Log the real cause so the storybook stays debuggable.
            // oxlint-disable-next-line no-console
            console.error('[mockContentLake] query failed:', (err as Error).message, {
              query,
              params,
            })
            throw err
          }
        })(),
      ),
    )
    return delay > 0 ? exec.pipe(delayOp(delay)) : exec
  }

  const client = {
    ...base,
    fetch: (query: string, params?: Record<string, unknown>) =>
      new Promise((resolve, reject) => {
        run(query, params).subscribe({next: resolve, error: reject})
      }),
    observable: {
      ...base.observable,
      fetch: (query: string, params?: Record<string, unknown>) => run(query, params),
    },
  } as unknown as SanityClient

  // `withConfig` is used by the search strategies to pin an API version; every derived client must
  // stay groq-backed or search silently falls back to the inert `of(null)` fetch.
  ;(client as unknown as {withConfig: () => SanityClient}).withConfig = () => client
  ;(client as unknown as {config: () => unknown}).config = () =>
    (base as unknown as {config: () => unknown}).config?.() ?? {
      projectId: 'mock',
      dataset: 'mock',
      apiVersion: '2021-06-07',
    }

  return client
}

/** An always-failing lake, for the error story. */
export function createFailingContentLakeClient(message = 'Search request failed'): SanityClient {
  return createMockContentLakeClient({documents: [], failWith: message, delay: 120})
}

/** A lake that never resolves, for the loading story. */
export function createPendingContentLakeClient(): SanityClient {
  const base = createMockSanityClient() as unknown as SanityClient
  const client = {
    ...base,
    fetch: () => new Promise(() => {}),
    observable: {...base.observable, fetch: () => new Observable(() => {})},
  } as unknown as SanityClient
  ;(client as unknown as {withConfig: () => SanityClient}).withConfig = () => client
  return client
}

export {of}
