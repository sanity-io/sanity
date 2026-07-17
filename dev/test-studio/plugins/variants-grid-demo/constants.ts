/**
 * The query-API parameter that selects a variant when fetching content.
 *
 * `@sanity/client` does not support passing a variant with queries yet, so the tool hand-rolls
 * the request with plain `fetch` (see `useContentLakeDocument.ts`). Once client support lands,
 * the hook collapses to `client.fetch(query, params, {variant})` (or whatever the final client
 * API is). If the deployed API expects a different parameter name, change it HERE — single source.
 */
export const VARIANT_QUERY_PARAM = 'variant'

/**
 * Experimental API version used while variants are in development (same as the studio's
 * variants client, see `VARIANTS_STUDIO_CLIENT_OPTIONS` in `sanity`).
 */
export const DEMO_API_VERSION = 'X'

/**
 * The whole point of the demo: the query only pins the document group id — which concrete
 * document comes back (published, draft, release version, variant…) is resolved entirely by
 * Content Lake from the `perspective` and `variant` request parameters.
 */
export const GROUP_DOCUMENT_QUERY = '*[_id == $id][0]'
