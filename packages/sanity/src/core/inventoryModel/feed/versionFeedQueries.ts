import {type ListenQueryParams} from '../../store/document/listenQuery'

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
 * The group (published) id of any version, in GROQ. Content Lake only stores `_system.group` on
 * variant versions today, so for every other document the group comes from the id:
 * `drafts.<id>` → `<id>`, `versions.<release>.<id>` → `<id>` (which may itself contain dots), and
 * a published document is its own group. Mirrors `buildDocumentSystem` on the client.
 *
 * Open slices (`[2...]`) do not parse, so the id parts are joined from `[2..100]`.
 */
const GROUP_ID = `coalesce(_system.group._ref, select(_id in path("drafts.**") => string::split(_id, "drafts.")[1], _id in path("versions.**") => array::join(string::split(_id, ".")[2..100], "."), _id))`

/**
 * The document list of a feed: the group id of every document that has at least one version
 * matching `filter`, each once, sorted by group id so the list (and so every page) is stable
 * while documents are edited. System documents (`_.**`: releases, variant definitions) are left
 * out. Returns ids only, so 1,000+ documents cost one small response.
 *
 * `filter` is a GROQ filter expression, for example `_type == "author"` or
 * `sanity::partOfVariant($variantId)`; its parameters go to the same {@link listenQuery} call.
 * Keep a type in it where you can: the list over one type answers in about 100 ms, over every
 * content type of a large dataset in seconds.
 *
 * @internal
 */
export function buildFeedGroupIdsQuery(filter: string): FeedQuery {
  const scope = `(${filter}) && !(_id in path("_.**"))`
  return {
    fetch: `array::unique(*[${scope}] | order(${GROUP_ID} asc){"g": ${GROUP_ID}}.g)`,
    listen: `*[${scope}]`,
  }
}

/**
 * One page of a feed: every version of the page's documents (`sanity::versionOf`, one parameter
 * per document), whatever `filter` the feed was built with, since the lenses read a document's
 * whole version set. The listener covers the same documents, so one listener keeps the whole page
 * live. `sanity::versionOf` matches published documents, classic drafts and release versions
 * alike, whether or not they store `_system.group`.
 *
 * @internal
 */
export function buildFeedPageQuery(groupIds: string[]): FeedQuery & {params: ListenQueryParams} {
  const params: ListenQueryParams = {}
  const filters = groupIds.map((groupId, index) => {
    params[`g${index}`] = groupId
    return `sanity::versionOf($g${index})`
  })
  // An empty page matches nothing.
  const scope = filters.length > 0 ? filters.join(' || ') : 'false'

  return {
    fetch: `*[${scope}]${VERSION_STUB_PROJECTION}`,
    listen: `*[${scope}]`,
    params,
  }
}
