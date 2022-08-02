import {ClockIcon, CloseIcon} from '@sanity/icons'
import {Box, Button, Flex, Text, Theme} from '@sanity/ui'
import React, {MouseEvent, useCallback} from 'react'
import styled, {css} from 'styled-components'
import {RecentSearch} from '../datastores/recentSearches'
import {TypePills} from './TypePills'

export interface RecentSearchesProps {
  value: RecentSearch
  onClick: (value: RecentSearch) => void
  onDelete: (event: MouseEvent) => void
}

const MAX_VISIBLE_QUERY_CHARS = 40 // (excluding ellipses)
const MAX_VISIBLE_TYPE_PILL_CHARS = 40

export function RecentSearchItem(props: RecentSearchesProps) {
  const {value, onClick, onDelete} = props
  const handleRecentSearchClick = useCallback(() => {
    onClick(value)
  }, [value, onClick])

  const typesSelected = value.types.length > 0

  let querySubstring = value.query?.substring(0, MAX_VISIBLE_QUERY_CHARS) || ''
  querySubstring =
    value.query.length > querySubstring.length ? `${querySubstring}...` : querySubstring

  const typePillsAvailableCharCount = MAX_VISIBLE_TYPE_PILL_CHARS - querySubstring.length

  return (
    <RecentSearchItemWrapper
      mode="bleed"
      onClick={handleRecentSearchClick}
      paddingLeft={3}
      paddingRight={1}
      paddingY={1}
    >
      <Flex align="center">
        <Box paddingY={2}>
          <Text size={2}>
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

const RecentSearchItemWrapper = styled(Button)(({theme}: {theme: Theme}) => {
  const {color} = theme.sanity
  // TODO: use idiomatic sanity/ui styling, double check usage of `bg2`
  return css`
    &[aria-selected='true'] {
      background: ${color.button.bleed.default.hovered.bg2};
    }
  `
})

const CloseButton = styled.div`
  opacity: 0.5;
  visibility: hidden;

  ${RecentSearchItemWrapper}:hover & {
    visibility: visible;
  }

  &:hover {
    opacity: 1;
  }
`
