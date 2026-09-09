import {type SanityClient} from '@sanity/client'

/**
 * Segments identifying the credentialed client an observable is built with:
 * `[token, dataset, projectId]`. Any module-level {@link memoize} of a
 * client-capturing observable MUST include these in its key — keying by
 * project/dataset alone replays a stale-token client after a cross-tab
 * re-login and 401s. Keyed by the token *value* (not the client instance) so
 * sibling clients sharing a token reuse one entry and only a real credential
 * change makes a new one.
 *
 * @internal
 */
export function getClientCredentialSegments(client: SanityClient): [string, string, string] {
  const {token, dataset, projectId} = client.config()
  return [token ?? '', dataset ?? '', projectId ?? '']
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
