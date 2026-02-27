import {type StackablePerspective} from '@sanity/client'
import {Card, Flex} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {styled} from 'styled-components'

import {CommandList, type CommandListRenderItemCallback} from '../../../../../../components'
import {useTranslation} from '../../../../../../i18n'
import {type WeightedHit} from '../../../../../../search'
import {useSearchState} from '../../contexts/search/useSearchState'
import {useRecentSearchesStore} from '../../datastores/recentSearches'
import {NoResults} from '../NoResults'
import {SearchError} from '../SearchError'
import {SortMenu} from '../SortMenu'
import {DebugOverlay} from './item/DebugOverlay'
import {type ItemSelectHandler, SearchResultItem} from './item/SearchResultItem'

const VIRTUAL_LIST_SEARCH_RESULT_ITEM_HEIGHT = 57 // px
const VIRTUAL_LIST_OVERSCAN = 4

const SearchResultsInnerFlex = styled(Flex)<{$loadingFirstPage: boolean}>`
  opacity: ${({$loadingFirstPage}) => ($loadingFirstPage ? 0.5 : 1)};
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  transition: 300ms opacity;
  width: 100%;
`

interface SearchResultsProps {
  disableIntentLink?: boolean
  inputElement: HTMLInputElement | null
  onItemSelect?: ItemSelectHandler
  previewPerspective?: StackablePerspective[]
}

export function SearchResults({
  disableIntentLink,
  inputElement,
  onItemSelect,
  previewPerspective,
}: SearchResultsProps) {
  const {
    dispatch,
    onClose,
    setSearchCommandList,
    state: {debug, filters, fullscreen, lastActiveIndex, result, terms, cursor},
  } = useSearchState()
  const {t} = useTranslation()
  const recentSearchesStore = useRecentSearchesStore()

  const hasSearchResults = !!result.hits.length
  const hasNoSearchResults = !result.hits.length && result.loaded
  const hasError = result.error

  /**
   * Add current search to recent searches, trigger child item click and close search
   */
  const handleSearchResultClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (recentSearchesStore) {
        recentSearchesStore.addSearch(terms, filters)
      }
      // We don't want to close the search if they are opening their result in a new tab
      if (!e.metaKey && !e.ctrlKey) {
        onClose?.()
      }
    },
    [filters, onClose, recentSearchesStore, terms],
  )

  const handleEndReached = useCallback(() => {
    dispatch({type: 'PAGE_INCREMENT'})
  }, [dispatch])

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
            paddingY={1}
          />
          {debug && <DebugOverlay data={item} />}
        </>
      )
    },
    [debug, disableIntentLink, handleSearchResultClick, onItemSelect, previewPerspective],
  )

  return (
    <Flex>
      <Card
        borderTop={fullscreen || !!(hasError || hasSearchResults || hasNoSearchResults)}
        flex={1}
      >
        <Flex direction="column" height="fill">
          {/* Sort menu */}
          {hasSearchResults && <SortMenu />}

          {/* Results */}
          <SearchResultsInnerFlex
            $loadingFirstPage={result.loading && cursor === null}
            aria-busy={result.loading}
            flex={1}
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
                    items={result.hits}
                    overscan={VIRTUAL_LIST_OVERSCAN}
                    onEndReached={handleEndReached}
                    paddingX={2}
                    paddingY={1}
                    ref={setSearchCommandList}
                    renderItem={renderItem}
                  />
                )}
                {hasNoSearchResults && <NoResults />}
              </>
            )}
          </SearchResultsInnerFlex>
        </Flex>
      </Card>
    </Flex>
  )
}
