import {Box, Button, Card, Label, Text, useMediaIndex} from '@sanity/ui'
import React, {useCallback, useMemo, useRef} from 'react'
import styled from 'styled-components'
import {
  CommandList,
  CommandListHandle,
  CommandListRenderItemCallback,
} from '../../../../../../components'
import {useSearchState} from '../../contexts/search/useSearchState'
import {RecentSearch} from '../../datastores/recentSearches'
import {Instructions} from '../Instructions'
import {useTranslation} from '../../../../../../i18n'
import {RecentSearchItem} from './item/RecentSearchItem'

const VIRTUAL_LIST_RECENT_SEARCH_ITEM_HEIGHT = 36 // px

// Max character count of selected document types (combined) by breakpoint
const MAX_COMBINED_TYPE_COUNT_SMALL = 20
const MAX_COMBINED_TYPE_COUNT_LARGE = 40

const RecentSearchesBox = styled(Card)`
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
`

interface RecentSearchesProps {
  inputElement?: HTMLInputElement | null
}

export function RecentSearches({inputElement}: RecentSearchesProps) {
  const {
    dispatch,
    recentSearchesStore,
    state: {filtersVisible, fullscreen, recentSearches},
  } = useSearchState()
  const commandListRef = useRef<CommandListHandle | null>(null)

  const {t} = useTranslation()

  /**
   * Remove terms from local storage.
   * Also re-focus input (on non-touch devices)
   */
  const handleClearRecentSearchesClick = useCallback(() => {
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore.removeSearch()
      dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    }
    commandListRef?.current?.focusInputElement()
  }, [dispatch, recentSearchesStore])

  const mediaIndex = useMediaIndex()

  const maxVisibleTypePillChars = useMemo(() => {
    return mediaIndex < 2 ? MAX_COMBINED_TYPE_COUNT_SMALL : MAX_COMBINED_TYPE_COUNT_LARGE
  }, [mediaIndex])

  const renderItem = useCallback<CommandListRenderItemCallback<RecentSearch>>(
    (item, {virtualIndex}) => {
      return (
        <RecentSearchItem
          index={virtualIndex}
          maxVisibleTypePillChars={maxVisibleTypePillChars}
          paddingBottom={1}
          value={item}
        />
      )
    },
    [maxVisibleTypePillChars],
  )

  const hasRecentSearches = !!recentSearches.length

  return (
    <RecentSearchesBox
      borderTop={hasRecentSearches || (!hasRecentSearches && !filtersVisible && fullscreen)}
      flex={1}
    >
      {recentSearches.length ? (
        <>
          <Box paddingBottom={2} paddingTop={4} paddingX={3}>
            <Label muted size={1}>
              {t('navbar.search.recent-searches-label')}
            </Label>
          </Box>
          <Box>
            <CommandList
              activeItemDataAttr="data-hovered"
              ariaLabel={t('navbar.search.recent-searches-label')}
              inputElement={inputElement}
              initialIndex={0}
              itemHeight={VIRTUAL_LIST_RECENT_SEARCH_ITEM_HEIGHT}
              items={recentSearches}
              paddingX={2}
              paddingY={1}
              renderItem={renderItem}
            />
          </Box>
          <Box paddingBottom={2} paddingTop={1} paddingX={2}>
            <Button
              fontSize={1}
              justify="flex-start"
              mode="bleed"
              onClick={handleClearRecentSearchesClick}
              padding={2}
              tone="default"
            >
              <Text muted size={1}>
                {t('navbar.search.action.clear-recent-searches')}
              </Text>
            </Button>
          </Box>
        </>
      ) : (
        !filtersVisible && fullscreen && <Instructions />
      )}
    </RecentSearchesBox>
  )
}
