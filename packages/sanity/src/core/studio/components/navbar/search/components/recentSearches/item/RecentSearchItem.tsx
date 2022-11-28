import {ClockIcon, CloseIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Flex,
  rem,
  ResponsiveMarginProps,
  ResponsivePaddingProps,
  Text,
} from '@sanity/ui'
import React, {MouseEvent, useCallback} from 'react'
import styled from 'styled-components'
import {useCommandList} from '../../../contexts/commandList'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {RecentSearch} from '../../../datastores/recentSearches'
import {CommandListItem} from '../../common/CommandListItem.styled'
import {DocumentTypesPill} from '../../common/DocumentTypesPill'
import {FilterPill} from '../../common/FilterPill'

export interface RecentSearchesProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  index: number
  maxVisibleTypePillChars?: number
  showFiltersOnClick?: boolean
  value: RecentSearch
}

const DEFAULT_COMBINED_TYPE_COUNT = 40

const RecentSearchItemButton = styled(Button)`
  border-radius: ${({theme}) => rem(theme.sanity.radius[2])};
  cursor: default;
`

const SearchItemPillsBox = styled(Box)`
  flex-shrink: 3;
`

const SearchItemQueryBox = styled(Box)`
  flex-shrink: 2;
`

const CloseButtonDiv = styled.div`
  opacity: 0.8;
  visibility: hidden;

  @media (hover: hover) {
    ${RecentSearchItemButton}:hover & {
      visibility: visible;
    }
    &:hover {
      opacity: 0.4;
    }
  }
`

export function RecentSearchItem({
  index,
  maxVisibleTypePillChars = DEFAULT_COMBINED_TYPE_COUNT,
  showFiltersOnClick,
  value,
  ...rest
}: RecentSearchesProps) {
  const {dispatch, recentSearchesStore} = useSearchState()

  const {onChildMouseDown, onChildMouseEnter} = useCommandList()

  // Determine how many characters are left to render type pills
  const availableCharacters = maxVisibleTypePillChars - value.query.length

  const handleClick = useCallback(() => {
    const hasFilters = value.filters && value.filters.length
    const hasTypes = value.types.length

    // Optionally show filters panel if search terms or filters are present
    if (showFiltersOnClick && (hasFilters || hasTypes)) {
      dispatch({type: 'FILTERS_VISIBLE_SET', visible: true})
    }
    dispatch({type: 'TERMS_SET', filters: value?.filters, terms: value})

    // Add to Local Storage
    if (recentSearchesStore) {
      const updatedRecentSearches = recentSearchesStore?.addSearch(value, value?.filters)
      dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
    }
  }, [dispatch, recentSearchesStore, showFiltersOnClick, value])

  const handleDelete = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      // Remove from Local Storage
      if (recentSearchesStore) {
        const updatedRecentSearches = recentSearchesStore?.removeSearchAtIndex(index)
        dispatch({recentSearches: updatedRecentSearches, type: 'RECENT_SEARCHES_SET'})
      }
    },
    [dispatch, index, recentSearchesStore]
  )

  return (
    <Box {...rest}>
      <RecentSearchItemButton
        as={CommandListItem}
        data-command-list-item
        mode="bleed"
        onClick={handleClick}
        onMouseDown={onChildMouseDown}
        onMouseEnter={onChildMouseEnter(index)}
        paddingLeft={3}
        paddingRight={1}
        paddingY={1}
      >
        <Flex align="stretch">
          <Box paddingY={2}>
            <Text muted size={1}>
              <ClockIcon />
            </Text>
          </Box>
          <Flex align="center" flex={1} gap={2} justify="flex-start" marginLeft={3} wrap="wrap">
            {/* Text query */}
            {value.query && (
              <SearchItemQueryBox marginLeft={1} paddingY={2}>
                <Text muted textOverflow="ellipsis">
                  {value.query}
                </Text>
              </SearchItemQueryBox>
            )}
            {/* Document type */}
            {value.types.length > 0 && (
              <SearchItemPillsBox>
                <DocumentTypesPill availableCharacters={availableCharacters} types={value.types} />
              </SearchItemPillsBox>
            )}
            {/* Filters */}
            {value?.filters?.map((filter, i) => {
              // eslint-disable-next-line react/no-array-index-key
              return <FilterPill filter={filter} key={i} />
            })}
          </Flex>

          {/* TODO: this is neither semantic nor accessible, consider revising */}
          <Flex align="center">
            <CloseButtonDiv onClick={handleDelete}>
              <Flex padding={2}>
                <Text size={1}>
                  <CloseIcon />
                </Text>
              </Flex>
            </CloseButtonDiv>
          </Flex>
        </Flex>
      </RecentSearchItemButton>
    </Box>
  )
}
