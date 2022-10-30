import {Button} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {KeyedSearchFilter} from '../../../types'
import {FilterTitle} from '../FilterTitle'

interface FilterMenuItemProps {
  filter: KeyedSearchFilter
  onClose: () => void
}

export const MenuItemFilter = React.memo(function MenuItemFilter({
  filter,
  onClose,
}: FilterMenuItemProps) {
  const {
    dispatch,
    state: {
      terms: {filters},
    },
  } = useSearchState()

  const handleClick = useCallback(() => {
    dispatch({filter, type: 'TERMS_FILTERS_ADD'})
    onClose?.()
  }, [dispatch, filter, onClose])

  const disabled = useMemo(() => {
    if (filter.type === 'compound') {
      return !!filters.find((f) => f.type === 'compound' && f.id === filter.id)
    }
    if (filter.type === 'field') {
      return false
    }
    return false
  }, [filter, filters])

  return (
    <Button
      disabled={disabled}
      fontSize={1}
      justify="flex-start"
      mode="bleed"
      onClick={handleClick}
      style={{
        whiteSpace: 'normal',
        width: '100%',
      }}
    >
      <FilterTitle filter={filter} showSubtitle />
    </Button>
  )
})
