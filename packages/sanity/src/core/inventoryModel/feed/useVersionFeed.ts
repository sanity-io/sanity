import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useClient} from '../../hooks/useClient'
import {type ListenQueryParams} from '../../store/document/listenQuery'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../variants/store/constants'
import {buildInventoryIndex} from '../buildInventoryIndex'
import {type InventoryIndex} from '../types'
import {
  createVersionFeed,
  INITIAL_VERSION_FEED_STATE,
  type VersionFeedRange,
  type VersionFeedState,
} from './createVersionFeed'

/**
 * Feeds the shared version model with live data, a page of documents at a time (see
 * {@link createVersionFeed}). Call `setVisibleRange` as the list scrolls; `index` holds the
 * versions of the pages around that range.
 *
 * @internal
 */
export function useVersionFeed({
  filter,
  params,
  releases,
  pageSize,
  overscanPages,
}: {
  filter: string
  params?: ListenQueryParams
  releases: Map<string, ReleaseDocument>
  pageSize?: number
  overscanPages?: number
}): {
  state: VersionFeedState
  index: InventoryIndex
  setVisibleRange: (range: VersionFeedRange) => void
} {
  // The variants API version, so filters such as `sanity::partOfVariant()` resolve.
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)
  // `params` must keep its identity across renders (memoize it), or the feed restarts.
  const feed = useMemo(
    () => createVersionFeed(client, {filter, params, pageSize, overscanPages}),
    [client, filter, params, pageSize, overscanPages],
  )

  const state = useObservable(feed.state$, INITIAL_VERSION_FEED_STATE)
  const index = useMemo(
    () => buildInventoryIndex({versions: state.versions, releases}),
    [state.versions, releases],
  )

  return {state, index, setVisibleRange: feed.setVisibleRange}
}
