import {ClockIcon, CloseIcon} from '@sanity/icons'
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
import {styled} from 'styled-components'

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

const RecentSearchItemButton = styled(Button)`
  border-radius: ${({theme}) => rem(theme.sanity.radius[2])};
  cursor: default;
  width: 100%;
`

const SearchItemPillsBox = styled(Box)`
  flex-shrink: 3;
`

const SearchItemQueryFlex = styled(Flex)`
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
  value,
  ...rest
}: RecentSearchesProps) {
  const {dispatch} = useSearchState()
  const recentSearchesStore = useRecentSearchesStore()

  // Determine how many characters are left to render type pills
  const availableCharacters = maxVisibleTypePillChars - value.query.length

  const handleClick = useCallback(() => {
    dispatch({type: 'TERMS_SET', filters: value?.filters, terms: value})

    // Add to Local Storage
    if (recentSearchesStore) {
      recentSearchesStore?.addSearch(value, value?.filters)
    }
  }, [dispatch, recentSearchesStore, value])

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
      <RecentSearchItemButton
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
              <SearchItemQueryFlex align="center" paddingY={2}>
                <Text muted size={1} textOverflow="ellipsis" weight="medium">
                  {value.query}
                </Text>
              </SearchItemQueryFlex>
            )}
            {/* Document type */}
            {value.types.length > 0 && (
              <SearchItemPillsBox>
                <DocumentTypesPill availableCharacters={availableCharacters} types={value.types} />
              </SearchItemPillsBox>
            )}
            {/* Filters */}
            {value?.filters?.map((filter, i) => {
              // oxlint-disable-next-line no-array-index-key
              return <FilterPill key={i} filter={filter} />
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
