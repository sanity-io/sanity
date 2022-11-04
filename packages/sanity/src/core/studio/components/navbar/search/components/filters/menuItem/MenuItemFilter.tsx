import {Button} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {ValidatedFilter} from '../../../types'
import {FilterTitle} from '../common/FilterTitle'

interface FilterMenuItemProps {
  filter: ValidatedFilter
  onClose: () => void
}

export const MenuItemFilter = React.memo(function MenuItemFilter({
  filter,
  onClose,
}: FilterMenuItemProps) {
  const {dispatch} = useSearchState()

  const handleClick = useCallback(() => {
    dispatch({filter, type: 'TERMS_FILTERS_ADD'})
    onClose?.()
  }, [dispatch, filter, onClose])

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
    >
      <FilterTitle filter={filter} showSubtitle />
    </Button>
  )
})
