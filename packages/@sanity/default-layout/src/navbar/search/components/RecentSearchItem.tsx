import {ClockIcon, CloseIcon} from '@sanity/icons'
import {Box, Button, Flex, Text} from '@sanity/ui'
import React, {MouseEvent, useCallback} from 'react'
import styled from 'styled-components'
import {useCommandList} from '../contexts/commandList'
import type {RecentSearch} from '../datastores/recentSearches'
import {TypePills} from './TypePills'

export interface RecentSearchesProps {
  index: number
  maxVisibleQueryChars?: number
  maxVisibleTypePillChars?: number
  onClick: (value: RecentSearch) => void
  onDelete: (event: MouseEvent) => void
  value: RecentSearch
}

const DEFAULT_MAX_QUERY_COUNT = 40
const DEFAULT_COMBINED_TYPE_COUNT = 40

export function RecentSearchItem(props: RecentSearchesProps) {
  const {
    index,
    maxVisibleQueryChars = DEFAULT_MAX_QUERY_COUNT,
    maxVisibleTypePillChars = DEFAULT_COMBINED_TYPE_COUNT,
    value,
    onClick,
    onDelete,
  } = props

  const {onChildClick, onChildMouseDown, onChildMouseEnter} = useCommandList()

  const handleRecentSearchClick = useCallback(() => {
    onChildClick?.()
    onClick(value)
  }, [onChildClick, onClick, value])

  const typesSelected = value.types.length > 0

  // Truncate search query if it exceeds max visible count
  let querySubstring = value.query?.substring(0, maxVisibleQueryChars) || ''
  querySubstring =
    value.query.length > querySubstring.length ? `${querySubstring}...` : querySubstring

  // Determine how many characters are left to render type pills
  const typePillsAvailableCharCount = maxVisibleTypePillChars - querySubstring.length

  return (
    <RecentSearchItemWrapper
      data-index={index}
      mode="bleed"
      onClick={handleRecentSearchClick}
      onMouseDown={onChildMouseDown}
      onMouseEnter={onChildMouseEnter(index)}
      paddingLeft={3}
      paddingRight={1}
      paddingY={1}
    >
      <Flex align="center">
        <Box paddingY={2}>
          <Text size={1}>
            <ClockIcon />
          </Text>
        </Box>
        <Flex align="center" flex={1} gap={3} marginLeft={3}>
          {querySubstring && (
            <Box marginLeft={1}>
              <Text>{querySubstring}</Text>
            </Box>
          )}
          {typesSelected && (
            <TypePills availableCharacters={typePillsAvailableCharCount} types={value.types} />
          )}
        </Flex>

        {/* TODO: this is neither semantic nor accessible, consider revising */}
        <CloseButton onClick={onDelete}>
          <Flex padding={2}>
            <Text size={1}>
              <CloseIcon />
            </Text>
          </Flex>
        </CloseButton>
      </Flex>
    </RecentSearchItemWrapper>
  )
}

const RecentSearchItemWrapper = styled(Button)``

const CloseButton = styled.div`
  opacity: 0.8;
  visibility: hidden;

  @media (hover: hover) {
    ${RecentSearchItemWrapper}:hover & {
      visibility: visible;
    }
    &:hover {
      opacity: 0.4;
    }
  }
`
