import {createClient, type SanityClient} from '@sanity/client'

import {API_HOST, API_VERSION, DATASET, PROJECT_ID, REQUEST_TAG_PREFIX} from './config'
import {type Split, Splitter} from './split'
import {type Json, type JsonObject, sleep} from './util'

/** A client in the `raw` perspective, with a bearer token or, without one, the session cookie. */
export function makeClient(token: string | undefined): SanityClient {
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiHost: `https://${API_HOST}`,
    apiVersion: API_VERSION,
    useCdn: false,
    perspective: 'raw',
    requestTagPrefix: REQUEST_TAG_PREFIX,
    ignoreBrowserTokenWarning: true,
    ...(token ? {token} : {withCredentials: true}),
  })
}

let current: SanityClient = makeClient(undefined)

export function client(): SanityClient {
  return current
}

export function setClient(next: SanityClient): void {
  current = next
}

/** The status code of a failed request, if it got a response. */
export function statusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const code = (error as {statusCode: unknown}).statusCode
    return typeof code === 'number' ? code : undefined
  }
  return undefined
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** The CDN URL of an asset reference: `image-<hash>-<w>x<h>-<ext>` / `file-<hash>-<ext>`. */
export function assetUrl(ref: string): string | undefined {
  const [kind, ...rest] = ref.split('-')
  if (kind === 'image' && rest.length === 3) {
    const [hash, size, ext] = rest
    return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${hash}-${size}.${ext}`
  }
  if (kind === 'file' && rest.length === 2) {
    const [hash, ext] = rest
    return `https://cdn.sanity.io/files/${PROJECT_ID}/${DATASET}/${hash}.${ext}`
  }
  return undefined
}

/** A document of a query result read by `queryDocuments`. */
export interface QueriedDocument {
  /** The document, when its JSON is no longer than the limit. */
  doc: JsonObject | undefined
  /** The fields asked for that the document has. */
  fields: JsonObject
  /** The length of its JSON, in bytes. */
  len: number
}

/** The splitter reads a network chunk this many bytes at a time, so a large chunk is split
 * between the documents it hands out rather than all at once. */
const SPLIT_STEP = 64 * 1024
const MAX_URL = 11_000
const MAX_RETRIES = 5

function retriable(status: number | undefined): boolean {
  return status === undefined || status === 429 || status === 502 || status === 503
}

/** Runs a query in the `raw` perspective, as `GET` unless its URL would be too long, retried the
 * way `@sanity/client` retries queries. */
async function queryResponse(
  groq: string,
  params: Record<string, unknown>,
  tag: string,
): Promise<Response> {
  const base = `https://${PROJECT_ID}.${API_HOST}/v${API_VERSION}/data/query/${DATASET}`
  const options = new URLSearchParams({perspective: 'raw', tag: `${REQUEST_TAG_PREFIX}.${tag}`})
  const search = new URLSearchParams({query: groq})
  for (const [key, value] of Object.entries(params)) search.set(`$${key}`, JSON.stringify(value))
  const get = `${base}?${search}&${options}`
  const token = current.config().token
  const headers: Record<string, string> = token ? {Authorization: `Bearer ${token}`} : {}
  const init: RequestInit =
    get.length <= MAX_URL
      ? {headers, credentials: token ? 'omit' : 'include'}
      : {
          method: 'POST',
          headers: {...headers, 'Content-Type': 'application/json'},
          credentials: token ? 'omit' : 'include',
          body: JSON.stringify({query: groq, params}),
        }
  const url = get.length <= MAX_URL ? get : `${base}?${options}`
  for (let attempt = 0; ; attempt++) {
    let status: number | undefined
    try {
      const response = await fetch(url, init)
      if (response.ok) return response
      status = response.status
      if (!retriable(status) || attempt >= MAX_RETRIES) {
        throw Object.assign(new Error(`HTTP ${status}: ${await response.text()}`), {
          statusCode: status,
        })
      }
    } catch (error) {
      if (statusCode(error) !== undefined || attempt >= MAX_RETRIES) throw error
    }
    await sleep(100 * 2 ** Math.min(attempt, 6) + Math.random() * 100)
  }
}

/**
 * Runs a query whose result is an array of documents, and reads the documents as the response
 * arrives: each with the top-level `fields` asked for, and parsed whole when its JSON is no
 * longer than `limit` bytes. Neither the response nor a document longer than the limit is ever
 * held or parsed whole, so the caller can store documents as they come and yield in between.
 */
export async function* queryDocuments(
  groq: string,
  params: Record<string, unknown>,
  tag: string,
  limit: number,
  fields: string[],
): AsyncGenerator<QueriedDocument> {
  const response = await queryResponse(groq, params, tag)
  const body = response.body
  if (!body) throw new Error('Response has no body')
  const reader = body.getReader()
  const splitter = new Splitter(limit, fields)
  const decoder = new TextDecoder()
  const document = (split: Split): QueriedDocument => {
    const doc = split.json ? (JSON.parse(decoder.decode(split.json)) as JsonObject) : undefined
    const picked: JsonObject = {}
    if (doc) {
      for (const field of fields) if (field in doc) picked[field] = doc[field]
    } else {
      for (const [index, raw] of split.fields)
        picked[fields[index]] = JSON.parse(decoder.decode(raw)) as Json
    }
    return {doc, fields: picked, len: split.len}
  }
  let done = false
  try {
    for (;;) {
      const read = await reader.read()
      if (read.done) break
      const chunk = read.value
      for (let offset = 0; offset < chunk.length; offset += SPLIT_STEP) {
        splitter.push(chunk.subarray(offset, offset + SPLIT_STEP))
        for (let split = splitter.pop(); split; split = splitter.pop()) yield document(split)
      }
    }
    done = true
    const error = splitter.finish()
    if (error) throw new Error(error)
  } finally {
    if (!done) void reader.cancel().catch(() => undefined)
  }
}

/** A GET request whose response isn't JSON (the history API's NDJSON), with the client's
 * credentials. */
export async function fetchText(
  path: string,
  query: Record<string, string>,
  tag: string,
): Promise<string> {
  const url = new URL(`https://${PROJECT_ID}.${API_HOST}/v${API_VERSION}${path}`)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
  url.searchParams.set('tag', `${REQUEST_TAG_PREFIX}.${tag}`)
  const token = current.config().token
  const response = await fetch(url, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    credentials: token ? 'omit' : 'include',
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  return response.text()
}
