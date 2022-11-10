import {Button} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {SearchFilterMenuItemFilter} from '../../../types'
import {FilterDetails} from '../common/FilterDetails'

interface FilterMenuItemProps {
  item: SearchFilterMenuItemFilter
  onClose: () => void
}

export const MenuItemFilter = React.memo(function MenuItemFilter({
  item,
  onClose,
}: FilterMenuItemProps) {
  const {
    dispatch,
    state: {filters},
  } = useSearchState()

  const handleClick = useCallback(() => {
    dispatch({filter: item.filter, type: 'TERMS_FILTERS_ADD'})
    onClose?.()
  }, [dispatch, item.filter, onClose])

  const isAlreadyActive = !!filters.find((f) => f._key === item.filter._key)

  return (
    <Button
      disabled={isAlreadyActive}
      fontSize={1}
      justify="flex-start"
      mode="bleed"
      onClick={handleClick}
      style={{
        whiteSpace: 'normal',
        width: '100%',
      }}
      tone={item?.tone}
    >
      <FilterDetails filter={item.filter} showSubtitle={item.showSubtitle} />
    </Button>
  )
})
