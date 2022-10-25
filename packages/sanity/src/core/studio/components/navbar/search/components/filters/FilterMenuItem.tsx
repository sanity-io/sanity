import {Button, Flex, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {FILTERS} from '../../config/filters'
import {useSearchState} from '../../contexts/search/useSearchState'
import type {SearchFilter} from '../../types'
import {FilterIcon} from './FilterIcon'

interface FilterMenuItemProps {
  filter: SearchFilter
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
        <Text size={1}>{title}</Text>
      </Flex>
    </Button>
  )
}
