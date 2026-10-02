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
 * Segments identifying the credentialed client an observable is built with:
 * `[credential, dataset, projectId]`. Any module-level {@link memoize} of a
 * client-capturing observable MUST include these in its key — keying by
 * project/dataset alone replays a stale-credential client after a cross-tab
 * re-login and 401s.
 *
 * The credential segment identifies the credential *source*, `config().auth`,
 * by reference: `withConfig` carries it over, so sibling clients derived from
 * one client share an entry, and the OAuth store hands out a new one for
 * every signed-in user (a sign-in, another user, new roles), so a new session
 * makes a new entry. It is deliberately not the
 * token value: under a reactive credential `config().token` is the token the
 * client last resolved and changes on every rotation, and keying on it would
 * rebuild every document pair per rotation (two listeners for one document
 * while the old pair drains, and an in-flight commit of the old pair aborted).
 * A static credential (`token` / `withCredentials`) is keyed by its token
 * value as before, so two clients created with the same token, or two cookie
 * clients, share an entry. The client derives an `auth` observable for those
 * too, but keeps it off the enumerable keys of `config()`; a caller-supplied
 * reactive `auth` is enumerable, which is how the two are told apart. A client
 * without `auth` at all (an older client, a test double) is keyed by its token.
 *
 * @internal
 */
export function getClientCredentialSegments(client: SanityClient): [string, string, string] {
  const config = client.config()
  const {dataset, projectId} = config
  const auth: unknown = Object.prototype.propertyIsEnumerable.call(config, 'auth')
    ? config.auth
    : undefined
  const credential =
    typeof auth === 'object' && auth !== null
      ? credentialSourceId(auth)
      : // oxlint-disable-next-line no-deprecated -- a static credential, where the read is exact
        (config.token ?? '')
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
