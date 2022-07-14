import {ClockIcon} from '@sanity/icons'
import {Button, Flex, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {RecentSearch} from './local-storage/search-store'
import {TypeNames} from './TypeNames'

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
    <Button mode="bleed" onClick={handleRecentSearchClick} paddingX={3} style={{width: '100%'}}>
      <Flex align="center">
        <Text size={2}>
          <ClockIcon />
        </Text>
        <Flex align="center" gap={1} marginLeft={3}>
          {value.query && <Text>{value.query}</Text>}
          {value.query && typesSelected && <Text>•</Text>}
          {typesSelected && (
            <Text size={1}>
              <TypeNames prefix={value.query ? 'In' : 'Everything in'} types={value.types} />
            </Text>
          )}
        </Flex>
      </Flex>
    </Button>
  )
}
