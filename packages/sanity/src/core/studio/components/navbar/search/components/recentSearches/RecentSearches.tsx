import {Box, Card, Text, useMediaIndex} from '@sanity/ui'
import {useCallback, useMemo, useRef} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../../../../ui-components'
import {
  CommandList,
  type CommandListHandle,
  type CommandListRenderItemCallback,
} from '../../../../../../components'
import {useTranslation} from '../../../../../../i18n'
import {useSearchState} from '../../contexts/search/useSearchState'
import {type RecentSearch, useRecentSearchesStore} from '../../datastores/recentSearches'
import {Instructions} from '../Instructions'
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
    state: {filtersVisible, fullscreen},
  } = useSearchState()
  const recentSearchesStore = useRecentSearchesStore()
  const recentSearches = useMemo(
    () => recentSearchesStore?.getRecentSearches(),
    [recentSearchesStore],
  )

  const commandListRef = useRef<CommandListHandle | null>(null)

  const {t} = useTranslation()

  /**
   * Remove terms from local storage.
   * Also re-focus input (on non-touch devices)
   */
  const handleClearRecentSearchesClick = useCallback(() => {
    if (recentSearchesStore) {
      recentSearchesStore.removeSearch()
    }
    commandListRef?.current?.focusInputElement()
  }, [recentSearchesStore])

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
      {recentSearches.length > 0 ? (
        <>
          <Box paddingBottom={2} paddingTop={4} paddingX={3}>
            <Text muted size={1} weight="medium">
              {t('search.recent-searches-label')}
            </Text>
          </Box>
          <Box>
            <CommandList
              activeItemDataAttr="data-hovered"
              ariaLabel={t('search.recent-searches-aria-label')}
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
              mode="bleed"
              onClick={handleClearRecentSearchesClick}
              tone="default"
              text={t('search.action.clear-recent-searches')}
              muted
            />
          </Box>
        </>
      ) : (
        !filtersVisible && fullscreen && <Instructions />
      )}
    </RecentSearchesBox>
  )
}
