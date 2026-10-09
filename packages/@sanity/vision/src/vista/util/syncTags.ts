import {type LiveEvent, type SyncTag} from '@sanity/client'

/** The API version that introduced sync tags (and the Live Content API) */
export const SYNC_TAGS_API_VERSION = 'v2021-03-25'

/**
 * The API version used for the live events subscription. Events are dataset-wide and tag-based,
 * so the query's own API version does not need to match.
 */
export const LIVE_EVENTS_API_VERSION = 'v2025-02-19'

/** Sync tags shared by a live event and the last query response, in the order the event lists them */
export function getMatchingSyncTags(
  eventTags: readonly SyncTag[],
  responseTags: readonly SyncTag[] | undefined,
): SyncTag[] {
  if (!responseTags || responseTags.length === 0 || eventTags.length === 0) {
    return []
  }
  const known = new Set(responseTags)
  return eventTags.filter((tag) => known.has(tag))
}

/**
 * Whether a live event should trigger a refetch of a query whose last response carried
 * `responseTags`. `restart` events always do: the server asks every client to resync.
 */
export function getLiveRefetchTags(
  event: LiveEvent | undefined,
  responseTags: readonly SyncTag[] | undefined,
): SyncTag[] | null {
  if (!event) {
    return null
  }
  if (event.type === 'restart') {
    return []
  }
  if (event.type !== 'message') {
    return null
  }
  const matched = getMatchingSyncTags(event.tags, responseTags)
  return matched.length > 0 ? matched : null
}
