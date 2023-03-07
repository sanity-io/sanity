import {Box, Card, Flex, Portal} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {
  CommandListProvider,
  type CommandListVirtualItemValue,
  useCommandList,
} from '../../../../components'
import {WeightedHit} from '../../../../search'
import {useColorScheme} from '../../../colorScheme'
import {Filters} from './components/filters/Filters'
import {RecentSearches} from './components/recentSearches/RecentSearches'
import {SearchHeader} from './components/SearchHeader'
import {SearchResults} from './components/searchResults/SearchResults'
import {useSearchState} from './contexts/search/useSearchState'
import type {RecentSearch} from './datastores/recentSearches'
import {useSearchHotkeys} from './hooks/useSearchHotkeys'
import {hasSearchableTerms} from './utils/hasSearchableTerms'

interface SearchDialogProps {
  onClose: () => void
  onOpen: () => void
  open: boolean
}

const InnerCard = styled(Card)`
  flex-direction: column;
  overflow: hidden;
  pointer-events: all;
  position: relative;
`

const SearchDialogBox = styled(Box)`
  height: 100%;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1;
`

/**
 * @internal
 */
export function SearchDialog({onClose, onOpen, open}: SearchDialogProps) {
  const isMountedRef = useRef(false)
  const [lastActiveIndex, setLastActiveIndex] = useState(-1)

  const {
    dispatch,
    setOnClose,
    state: {filtersVisible, recentSearches, result, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  /**
   * Store top-most search result scroll index on close
   */
  const handleClose = useCallback(
    (index: number) => {
      setLastActiveIndex(index)
      onClose()
    },
    [onClose]
  )

  /**
   * Bind hotkeys to open action
   */
  useSearchHotkeys({onOpen, open})

  /**
   * Reset last search index when new results are loaded, or visiting recent searches
   */
  // @todo Revise if/when we introduce pagination
  useEffect(() => {
    if ((!hasValidTerms || result.loaded) && isMountedRef.current) {
      setLastActiveIndex(0)
    }
  }, [hasValidTerms, result.loaded])

  /**
   * Reset ordering when popover is closed (without valid search terms)
   */
  useEffect(() => {
    if (!hasValidTerms && isMountedRef.current && !open) {
      dispatch({type: 'ORDERING_RESET'})
    }
  }, [dispatch, hasValidTerms, open])

  /**
   * Set shared `onClose` in search context
   */
  useEffect(() => {
    setOnClose(onClose)
  }, [onClose, setOnClose])

  /**
   * Store mounted state
   */
  useEffect(() => {
    if (!isMountedRef?.current) {
      isMountedRef.current = true
    }
  }, [])

  const values: CommandListVirtualItemValue<RecentSearch | WeightedHit>[] = useMemo(() => {
    if (hasValidTerms) {
      return result.hits.map((i) => ({value: i}))
    }

    return recentSearches.map((i) => ({value: i}))
  }, [hasValidTerms, recentSearches, result.hits])

  if (!open) {
    return null
  }

  return (
    <Portal>
      <FocusLock autoFocus={false} returnFocus>
        <CommandListProvider
          activeItemDataAttr="data-hovered"
          ariaChildrenLabel={hasValidTerms ? 'Search results' : 'Recent searches'}
          ariaInputLabel="Search"
          autoFocus
          data-testid="search-results-dialog"
          initialIndex={hasValidTerms ? lastActiveIndex : 0}
          values={values}
        >
          <SearchDialogContent
            filtersVisible={filtersVisible}
            hasValidTerms={hasValidTerms}
            onClose={handleClose}
            open={open}
          />
        </CommandListProvider>
      </FocusLock>
    </Portal>
  )
}

function SearchDialogContent({
  filtersVisible,
  hasValidTerms,
  onClose,
  open,
}: {
  filtersVisible: boolean
  hasValidTerms: boolean
  onClose: (lastActiveIndex: number) => void
  open: boolean
}) {
  const {scheme} = useColorScheme()
  const {getTopIndex} = useCommandList()

  /**
   * Store top-most search result scroll index on close
   */
  const handleClose = useCallback(() => {
    onClose(getTopIndex())
  }, [getTopIndex, onClose])

  /**
   * Bind hotkeys to close action
   */
  useSearchHotkeys({onClose: handleClose, open})

  return (
    <SearchDialogBox>
      <InnerCard display="flex" height="fill" scheme={scheme} tone="default">
        <SearchHeader onClose={handleClose} />
        {filtersVisible && (
          <Card borderTop style={{flexShrink: 0}}>
            <Filters />
          </Card>
        )}

        <Flex>{hasValidTerms ? <SearchResults onClose={handleClose} /> : <RecentSearches />}</Flex>
      </InnerCard>
    </SearchDialogBox>
  )
}
