import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useClient} from '../../hooks/useClient'
import {useSchema} from '../../hooks/useSchema'
import {useDocumentPreviewStore} from '../../store/datastores'
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
import {type FeedTitleRow, getFeedTitleRows, observeFeedTitles} from './observeFeedTitles'

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

const EMPTY_TITLES = new Map<string, string | undefined>()

/**
 * Titles for the rows on screen only (see {@link observeFeedTitles}), read through the document
 * preview store so they follow each type's preview configuration.
 *
 * @internal
 */
export function useVersionFeedTitles(
  index: InventoryIndex,
  visibleGroupIds: string[],
): Map<string, string | undefined> {
  const {observeForPreview} = useDocumentPreviewStore()
  const schema = useSchema()
  // Keyed on the rows' content, not on array identity, so scrolling within loaded rows and
  // live edits that keep each row's title version reuse the same subscriptions.
  // Ids and type names cannot contain a newline or a tab, so the key splits back into rows.
  const rowsKey = getFeedTitleRows(index, visibleGroupIds)
    .map(({groupId, _id, _type}) => `${groupId}\t${_id}\t${_type}`)
    .join('\n')

  const titles$ = useMemo(
    () =>
      observeFeedTitles({
        rows: rowsKey ? rowsKey.split('\n').map(toTitleRow) : [],
        observeForPreview,
        getSchemaType: (typeName) => schema.get(typeName),
      }),
    [rowsKey, observeForPreview, schema],
  )

  return useObservable(titles$, EMPTY_TITLES)
}

function toTitleRow(line: string): FeedTitleRow {
  const [groupId = '', _id = '', _type = ''] = line.split('\t')
  return {groupId, _id, _type}
}
