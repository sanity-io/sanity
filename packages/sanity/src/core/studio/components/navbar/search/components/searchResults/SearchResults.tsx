import {type StackablePerspective} from '@sanity/client'
import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type MouseEvent, useCallback, useDeferredValue} from 'react'
import {Flex} from 'ui5'

import {CommandList} from '../../../../../../components/commandList/CommandList'
import {type CommandListRenderItemCallback} from '../../../../../../components/commandList/types'
import {useTranslation} from '../../../../../../i18n/hooks/useTranslation'
import {type WeightedHit} from '../../../../../../search/common/types'
import {useSearchSelector, useSearchState} from '../../contexts/search/useSearchState'
import {useRecentSearchesStore} from '../../datastores/recentSearches'
import {NoResults} from '../NoResults'
import {SearchError} from '../SearchError'
import {SortMenu} from '../SortMenu'
import {DebugOverlay} from './item/DebugOverlay'
import {type ItemSelectHandler, SearchResultItem} from './item/SearchResultItem'
import {loadingFirstPage, searchResultsInnerFlex} from './SearchResults.css'

const VIRTUAL_LIST_SEARCH_RESULT_ITEM_HEIGHT = 57 // px
const VIRTUAL_LIST_OVERSCAN = 4

interface SearchResultsProps {
  disableIntentLink?: boolean
  inputElement: HTMLInputElement | null
  onItemSelect?: ItemSelectHandler
  previewPerspective?: StackablePerspective[]
  /**
   * The variant the result previews are resolved in, as a bare variant id.
   */
  previewVariant?: string
}

export function SearchResults({
  disableIntentLink,
  inputElement,
  onItemSelect,
  previewPerspective,
  previewVariant,
}: SearchResultsProps) {
  const {fullscreen, onClose, searchActorRef, searchCommandListRef} = useSearchState()
  const hits = useSearchSelector((snapshot) => snapshot.context.result.hits)
  const loaded = useSearchSelector((snapshot) => snapshot.context.result.loaded)
  const loading = useSearchSelector((snapshot) => snapshot.context.result.loading)
  const error = useSearchSelector((snapshot) => snapshot.context.result.error)
  const isLoadingFirstPage = useSearchSelector(
    (snapshot) => snapshot.context.result.loading && snapshot.context.cursor === null,
  )
  const lastActiveIndex = useSearchSelector((snapshot) => snapshot.context.lastActiveIndex)
  const debug = useSearchSelector((snapshot) => snapshot.context.debug)
  const {t} = useTranslation()
  const recentSearchesStore = useRecentSearchesStore()

  // deferral only pays off because CommandList is memo()'d, so the urgent render skips the heavy row subtree
  const deferredHits = useDeferredValue(hits)
  const isPending = deferredHits !== hits

  // requiring hits too hides the stale list the instant an empty result settles
  const hasSearchResults = deferredHits.length > 0 && hits.length > 0
  const hasNoSearchResults = hits.length === 0 && loaded
  const hasError = error

  /**
   * Add current search to recent searches, trigger child item click and close search
   */
  const handleSearchResultClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (recentSearchesStore) {
        // Read on click rather than subscribing, so typing doesn't re-render the results
        const {filters, terms} = searchActorRef.getSnapshot().context
        recentSearchesStore.addSearch(terms, filters)
      }
      // We don't want to close the search if they are opening their result in a new tab
      if (!e.metaKey && !e.ctrlKey) {
        onClose?.()
      }
    },
    [onClose, recentSearchesStore, searchActorRef],
  )

  const handleEndReached = useCallback(() => {
    searchActorRef.send({type: 'PAGE_INCREMENT'})
  }, [searchActorRef])

  const renderItem = useCallback<CommandListRenderItemCallback<WeightedHit>>(
    (item) => {
      return (
        <>
          <SearchResultItem
            disableIntentLink={disableIntentLink}
            documentId={item.hit._id || ''}
            documentType={item.hit._type}
            onClick={handleSearchResultClick}
            onItemSelect={onItemSelect}
            previewPerspective={previewPerspective}
            previewVariant={previewVariant}
            paddingY={1}
          />
          {debug && <DebugOverlay data={item} />}
        </>
      )
    },
    [
      debug,
      disableIntentLink,
      handleSearchResultClick,
      onItemSelect,
      previewPerspective,
      previewVariant,
    ],
  )

  return (
    <Flex>
      <Card
        borderTop={fullscreen || !!(hasError || hasSearchResults || hasNoSearchResults)}
        flex={1}
      >
        <Flex flexDirection="column" height="100%">
          {/* Sort menu */}
          {hasSearchResults && <SortMenu />}

          {/* Results */}
          <Flex
            aria-busy={loading || isPending}
            className={clsx(searchResultsInnerFlex, isLoadingFirstPage && loadingFirstPage)}
            flexBasis="0%"
            flexGrow={1}
          >
            {hasError ? (
              <SearchError />
            ) : (
              <>
                {hasSearchResults && (
                  <CommandList
                    activeItemDataAttr="data-hovered"
                    ariaLabel={t('search.search-results-label')}
                    data-testid="search-results"
                    fixedHeight
                    initialIndex={lastActiveIndex}
                    inputElement={inputElement}
                    itemHeight={VIRTUAL_LIST_SEARCH_RESULT_ITEM_HEIGHT}
                    items={deferredHits}
                    overscan={VIRTUAL_LIST_OVERSCAN}
                    onEndReached={handleEndReached}
                    paddingX={2}
                    paddingY={1}
                    ref={searchCommandListRef}
                    renderItem={renderItem}
                  />
                )}
                {hasNoSearchResults && <NoResults />}
              </>
            )}
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
