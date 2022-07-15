import {ClockIcon} from '@sanity/icons'
import {Box, Button, Flex, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {RecentSearch} from './local-storage/search-store'
import {TypePills} from './TypePills'

export interface RecentSearchesProps {
  value: RecentSearch
  onClick: (value: RecentSearch) => void
}

export function RecentSearchItem(props: RecentSearchesProps) {
  const {value, onClick} = props
  const handleRecentSearchClick = useCallback(() => {
    onClick(value)
  }, [value, onClick])

  const typesSelected = value.types.length > 0

  return (
    <Button
      mode="bleed"
      onClick={handleRecentSearchClick}
      paddingX={3}
      paddingY={1}
      style={{width: '100%'}}
    >
      <Flex align="center">
        <Box paddingY={2}>
          <Text size={2}>
            <ClockIcon />
          </Text>
        </Box>
        <Flex align="center" flex={1} gap={3} marginLeft={3}>
          {value.query && (
            <Box marginLeft={1}>
              <Text>{value.query}</Text>
            </Box>
          )}
          {typesSelected && <TypePills types={value.types} />}
        </Flex>
      </Flex>
    </Button>
  )
}
