import {Button, Code, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {FILTERS} from '../../config/filters'
import {useSearchState} from '../../contexts/search/useSearchState'
import type {KeyedSearchFilter} from '../../types'
import {FilterIcon} from './FilterIcon'

interface FilterMenuItemProps {
  filter: KeyedSearchFilter
  onClose: () => void
}

export function FilterMenuItem({filter, onClose}: FilterMenuItemProps) {
  const {dispatch} = useSearchState()

  const handleClick = useCallback(() => {
    dispatch({filter, type: 'TERMS_FILTERS_ADD'})
    onClose?.()
  }, [dispatch, filter, onClose])

  const title = useMemo(() => {
    if (filter.type === 'compound') {
      return FILTERS.compound[filter.id].title
    }
    if (filter.type === 'field') {
      return filter.path.join(' / ')
    }
    return 'Unknown type'
  }, [filter])

  return (
    <Button
      fontSize={1}
      justify="flex-start"
      mode="bleed"
      onClick={handleClick}
      style={{
        whiteSpace: 'normal',
        width: '100%',
      }}
      tone={filter.type === 'field' ? 'primary' : 'default'}
    >
      <Flex align="flex-start" gap={3}>
        <Text size={1}>
          <FilterIcon filter={filter} />
        </Text>
        <Stack space={2}>
          <Text size={1}>{title}</Text>
          {filter.showSubtitle && (
            <Code muted size={0}>
              {filter.type === 'field' ? filter.fieldPath : ''}
            </Code>
          )}
        </Stack>
      </Flex>
    </Button>
  )
}
