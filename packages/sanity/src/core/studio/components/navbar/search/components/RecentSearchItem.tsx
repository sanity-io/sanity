import {ClockIcon, CloseIcon} from '@sanity/icons'
import {Box, Button, Flex, Text} from '@sanity/ui'
import React, {MouseEvent, useCallback} from 'react'
import styled, {css} from 'styled-components'
import {useCommandList} from '../contexts/commandList'
import type {RecentSearchTerms} from '../datastores/recentSearches'
import {TypePills} from './TypePills'

export interface RecentSearchesProps {
  index: number
  maxVisibleTypePillChars?: number
  onClick: (value: RecentSearchTerms) => void
  onDelete: (event: MouseEvent) => void
  value: RecentSearchTerms
}

const DEFAULT_COMBINED_TYPE_COUNT = 40

const RecentSearchItemButton = styled(Button)<{$level: number}>(({$level}) => {
  return css`
    [data-focused='true'][data-level='${$level}'] &,
    [data-hovered='true'][data-level='${$level}'] & {
      &[data-active='true'] {
        // TODO: investigate issue where this background isn't respected after switching studio theme _multiple_ times (at least twice)
        background: ${({theme}) => theme.sanity.color.button.bleed.default.hovered.bg};
        // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
        box-shadow: none;
      }
    }
  `
})

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

export function RecentSearchItem(props: RecentSearchesProps) {
  const {
    index,
    maxVisibleTypePillChars = DEFAULT_COMBINED_TYPE_COUNT,
    value,
    onClick,
    onDelete,
  } = props

  const {level, onChildClick, onChildMouseDown, onChildMouseEnter} = useCommandList()

  const handleRecentSearchClick = useCallback(() => {
    onChildClick?.()
    onClick(value)
  }, [onChildClick, onClick, value])

  const typesSelected = value.types.length > 0

  // Determine how many characters are left to render type pills
  const availableCharacters = maxVisibleTypePillChars - value.query.length

  return (
    <RecentSearchItemButton
      $level={level}
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
        <Flex align="center" flex={1} gap={3} justify="flex-start" marginLeft={3}>
          {value.query && (
            <SearchItemQueryBox marginLeft={1}>
              <Text textOverflow="ellipsis">{value.query}</Text>
            </SearchItemQueryBox>
          )}
          {typesSelected && (
            <SearchItemPillsBox>
              <TypePills availableCharacters={availableCharacters} types={value.types} />
            </SearchItemPillsBox>
          )}
        </Flex>

        {/* TODO: this is neither semantic nor accessible, consider revising */}
        <CloseButtonDiv onClick={onDelete}>
          <Flex padding={2}>
            <Text size={1}>
              <CloseIcon />
            </Text>
          </Flex>
        </CloseButtonDiv>
      </Flex>
    </RecentSearchItemButton>
  )
}
