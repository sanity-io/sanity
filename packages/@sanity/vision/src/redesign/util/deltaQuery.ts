import {evaluate, parse} from 'groq-js'

import {isPlainObject} from '../../util/isPlainObject'

/**
 * Delta GROQ, the mode GROQ-powered webhooks, listeners and Sanity Functions filter and project
 * changes with: `before()` and `after()` are a document before and after a change, `@` is the
 * document as it is after it (as it was, for a delete), and `delta::changedAny()`,
 * `delta::changedOnly()` and `delta::operation()` compare the two. The Content Lake's query
 * endpoint has no delta mode, so it runs in the browser with groq-js.
 */

export type DeltaOperation = 'create' | 'update' | 'delete'

/** What `delta::operation()` says about a change: `null` with neither document */
export function deltaOperation(before: unknown, after: unknown): DeltaOperation | null {
  if (before === null) return after === null ? null : 'create'
  return after === null ? 'delete' : 'update'
}

export interface DeltaInput {
  query: string
  params: Record<string, unknown>
  /** The document before the change, `null` when the change creates it */
  before: unknown
  /** The document after the change, `null` when the change deletes it */
  after: unknown
}

export async function evaluateDelta({query, params, before, after}: DeltaInput): Promise<unknown> {
  const tree = parse(query, {mode: 'delta', params})
  const value = await evaluate(tree, {
    params,
    before: before ?? undefined,
    after: after ?? undefined,
    root: after ?? before ?? undefined,
  })
  return value.get()
}

export interface DocumentRevision {
  /** The transaction's id, which is the document's `_rev` after it */
  id: string
  timestamp: string
  author: string | undefined
}

/** What loading a document's history needs of a client; a `SanityClient` has it */
export interface HistoryClient {
  getDataUrl: (operation: string, path?: string) => string
  request: (options: {url: string; tag: string; signal?: AbortSignal}) => Promise<unknown>
}

/** The history endpoints answer NDJSON, which the client hands over as text */
function readLines(body: unknown): unknown[] {
  if (typeof body === 'string') {
    return body
      .split('\n')
      .filter((line) => line.trim())
      .map((line): unknown => JSON.parse(line))
  }
  if (Array.isArray(body)) return body
  return isPlainObject(body) ? [body] : []
}

/** The document's latest revisions, newest first, from the History API's transactions */
export async function loadRevisions(
  client: HistoryClient,
  documentId: string,
  limit = 20,
): Promise<DocumentRevision[]> {
  const body = await client.request({
    url: client.getDataUrl(
      'history',
      `transactions/${encodeURIComponent(documentId)}?excludeContent=true&reverse=true&limit=${limit}`,
    ),
    tag: 'vision.delta',
  })
  return readLines(body).flatMap((line) =>
    isPlainObject(line) && typeof line.id === 'string'
      ? [
          {
            id: line.id,
            timestamp: typeof line.timestamp === 'string' ? line.timestamp : '',
            author: typeof line.author === 'string' ? line.author : undefined,
          },
        ]
      : [],
  )
}

/** The document as it was at a revision, `null` when it did not exist then */
export async function loadRevision(
  client: HistoryClient,
  documentId: string,
  revision: string,
): Promise<unknown> {
  const body = await client.request({
    url: client.getDataUrl(
      'history',
      `documents/${encodeURIComponent(documentId)}?revision=${encodeURIComponent(revision)}`,
    ),
    tag: 'vision.delta',
  })
  const documents = isPlainObject(body) && Array.isArray(body.documents) ? body.documents : []
  return documents[0] ?? null
}
