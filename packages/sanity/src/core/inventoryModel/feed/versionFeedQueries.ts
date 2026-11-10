/**
 * A fetch query and the listener filter that keeps it fresh, the pair {@link listenQuery} takes.
 *
 * @internal
 */
export interface FeedQuery {
  fetch: string
  listen: string
}

/**
 * The fields a page reads from each version: what {@link toVersionStub} needs, nothing else. No
 * content fields, so a page of fifty documents with a dozen versions each stays small.
 */
const VERSION_STUB_PROJECTION = `{_id, _type, _rev, _createdAt, _updatedAt, _system}`

/**
 * The document list of a feed: the group id (`_system.group._ref`) of every document that has at
 * least one version matching `filter`, each once, sorted by group id so the list (and so every
 * page) is stable while documents are edited. Returns ids only, so 1,000+ documents cost one
 * small response.
 *
 * `filter` is a GROQ filter expression, for example `_type == "product"` or
 * `sanity::partOfVariant($variantId)`; its parameters go to the same {@link listenQuery} call.
 *
 * @internal
 */
export function buildFeedGroupIdsQuery(filter: string): FeedQuery {
  const scope = `(${filter}) && defined(_system.group._ref)`
  return {
    fetch: `array::unique(*[${scope}] | order(_system.group._ref asc)._system.group._ref)`,
    listen: `*[${scope}]`,
  }
}

/**
 * One page of a feed: every version of the page's documents, whatever `filter` the feed was
 * built with, since the lenses read a document's whole version set (its Published and Drafts
 * rows too). The listener covers the same documents, so one listener keeps the whole page live.
 *
 * Takes its group ids as the `$groupIds` parameter.
 *
 * @internal
 */
export function buildFeedPageQuery(): FeedQuery {
  const scope = `_system.group._ref in $groupIds`
  return {
    fetch: `*[${scope}]${VERSION_STUB_PROJECTION}`,
    listen: `*[${scope}]`,
  }
}
