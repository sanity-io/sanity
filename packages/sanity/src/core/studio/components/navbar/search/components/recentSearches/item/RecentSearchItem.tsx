import {ClockIcon, CloseIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button, // Button with specific styling and children behavior.
  Flex,
  Inline,
  rem,
  type ResponsiveMarginProps,
  type ResponsivePaddingProps,
  Text,
} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'

import {RecentSearchClicked} from '../../../__telemetry__/search.telemetry'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {type RecentSearch, useRecentSearchesStore} from '../../../datastores/recentSearches'
import {DocumentTypesPill} from '../../common/DocumentTypesPill'
import {FilterPill} from '../../common/FilterPill'

export interface RecentSearchesProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  index: number
  maxVisibleTypePillChars?: number
  value: RecentSearch
}

const DEFAULT_COMBINED_TYPE_COUNT = 40

import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {recentSearchItemButton, searchItemPillsBox, searchItemQueryFlex, closeButtonDiv, radiusVar} from './RecentSearchItem.css'

export function RecentSearchItem({
  index,
  maxVisibleTypePillChars = DEFAULT_COMBINED_TYPE_COUNT,
  value,
  ...rest
}: RecentSearchesProps) {
  const {radius} = useThemeV2()
  const {dispatch} = useSearchState()
  const recentSearchesStore = useRecentSearchesStore()
  const telemetry = useTelemetry()

  // Determine how many characters are left to render type pills
  const availableCharacters = maxVisibleTypePillChars - value.query.length

  const handleClick = useCallback(() => {
    dispatch({type: 'TERMS_SET', filters: value?.filters, terms: value})

    // Add to Local Storage
    if (recentSearchesStore) {
      recentSearchesStore?.addSearch(value, value?.filters)
    }

    telemetry.log(RecentSearchClicked)
  }, [dispatch, recentSearchesStore, telemetry, value])

  const handleDelete = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      // Remove from Local Storage
      if (recentSearchesStore) {
        recentSearchesStore?.removeSearchAtIndex(index)
      }
    },
    [index, recentSearchesStore],
  )

  return (
    <Box {...rest}>
      <Button
        className={recentSearchItemButton}
        style={assignInlineVars({[radiusVar]: `${rem(radius[2])}px`})}
        mode="bleed"
        onClick={handleClick}
        paddingLeft={3}
        paddingRight={1}
        paddingY={1}
        tabIndex={-1}
      >
        <Flex align="stretch">
          {/* Combination of <Inline> and a zero-width character to ensure icon is optically aligned with adjacent text */}
          <Inline paddingY={2}>
            <Text muted size={1}>
              <ClockIcon />
            </Text>
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <Text>&#8203;</Text>
          </Inline>
          <Flex align="stretch" flex={1} gap={2} justify="flex-start" marginLeft={3} wrap="wrap">
            {/* Text query */}
            {value.query && (
              <Flex className={searchItemQueryFlex} align="center" paddingY={2}>
                <Text muted size={1} textOverflow="ellipsis" weight="medium">
                  {value.query}
                </Text>
              </Flex>
            )}
            {/* Document type */}
            {value.types.length > 0 && (
              <Box className={searchItemPillsBox}>
                <DocumentTypesPill availableCharacters={availableCharacters} types={value.types} />
              </Box>
            )}
            {/* Filters */}
            {value?.filters?.map((filter, i) => {
              // oxlint-disable-next-line no-array-index-key
              return <FilterPill key={i} filter={filter} />
            })}
          </Flex>

          {/* TODO: this is neither semantic nor accessible, consider revising */}
          <Flex align="center">
            <div className={closeButtonDiv} onClick={handleDelete}>
              <Flex padding={2}>
                <Text size={1}>
                  <CloseIcon />
                </Text>
              </Flex>
            </div>
          </Flex>
        </Flex>
      </Button>
    </Box>
  )
}
