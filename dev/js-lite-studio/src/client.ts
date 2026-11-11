import {createClient, type SanityClient} from '@sanity/client'

import {API_HOST, API_VERSION, DATASET, PROJECT_ID, REQUEST_TAG_PREFIX} from './config'

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
