import {type SanityClient} from '@sanity/client'

/**
 * A stable id per credential source (`config().auth` observable). `WeakMap`, so a source that
 * is no longer referenced anywhere, e.g. a signed-out session's, does not keep its id alive.
 */
const credentialSourceIds = new WeakMap<object, string>()
let nextCredentialSourceId = 0

function credentialSourceId(auth: object): string {
  let id = credentialSourceIds.get(auth)
  if (id === undefined) {
    id = `auth:${++nextCredentialSourceId}`
    credentialSourceIds.set(auth, id)
  }
  return id
}

/**
 * Segments that identify the client a client-capturing observable was built with:
 * `[credential, dataset, projectId]`. A reactive `auth` is keyed by reference: a rotation keeps
 * the key, a new session gets a new one. A static credential is keyed by its token. Include these
 * in the key of any module-level {@link memoize} of such an observable.
 *
 * @internal
 */
export function getClientCredentialSegments(client: SanityClient): [string, string, string] {
  const config = client.config()
  const {dataset, projectId} = config
  const credential = config.auth ? credentialSourceId(config.auth) : (config.token ?? '')
  return [credential, dataset ?? '', projectId ?? '']
}

/**
 * Builds a memo cache key from an ordered list of segments. Segments are joined
 * via `JSON.stringify` rather than a `-` (or any single delimiter): the raw
 * values routinely contain dashes (dataset names like `test-dataset`, document
 * ids, type names), so a plain join lets distinct tuples collide into the same
 * string (`['a-b','c']` and `['a','b-c']` both become `a-b-c`) and reuse the
 * wrong cached observable. The result is an opaque cache key — never parsed or
 * shown to users.
 *
 * @internal
 */
export function createMemoKey(segments: readonly (string | undefined)[]): string {
  return JSON.stringify(segments.map((segment) => segment ?? ''))
}
