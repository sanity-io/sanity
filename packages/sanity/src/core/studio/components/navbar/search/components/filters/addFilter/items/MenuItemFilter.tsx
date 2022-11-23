import {Box, Button} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useCommandList} from '../../../../contexts/commandList'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import type {FilterMenuItemFilter} from '../../../../types'
import {getFilterKey} from '../../../../utils/filterUtils'
import {CommandListItem} from '../../../common/CommandListItem.styled'
import {FilterDetails} from '../../common/FilterDetails'
import {FilterTooltip} from './FilterTooltip'

interface FilterMenuItemProps {
  index: number
  item: FilterMenuItemFilter
  onClose: () => void
}

export const MenuItemFilter = React.memo(function MenuItemFilter({
  index,
  item,
  onClose,
}: FilterMenuItemProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const {
    dispatch,
    state: {filters},
  } = useSearchState()

  const {onChildClick, onChildMouseDown, onChildMouseEnter} = useCommandList()

  const handleClick = useCallback(() => {
    dispatch({filter: item.filter, type: 'TERMS_FILTERS_ADD'})
    onChildClick?.()
    onClose?.()
  }, [dispatch, item.filter, onChildClick, onClose])

  const isAlreadyActive = !!filters.find((f) => getFilterKey(f) === getFilterKey(item.filter))

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleMouseEnter = useCallback(() => {
    onChildMouseEnter(index)()
    timeoutRef.current = setTimeout(() => setTooltipVisible(true), 500)
  }, [index, onChildMouseEnter])
  const handleMouseLeave = useCallback(() => {
    setTooltipVisible(false)
    clearTimeout(timeoutRef.current)
  }, [])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  // Only enable tooltips if an associated field definition exists, or the filter has a valid description
  const tooltipEnabled = !!(item.fieldDefinition || item.filterDefinition.description)

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      paddingTop={1}
      paddingX={1}
    >
      <FilterTooltip
        fieldDefinition={item.fieldDefinition}
        filterDefinition={item.filterDefinition}
        visible={tooltipEnabled && tooltipVisible}
      >
        <Button
          as={CommandListItem}
          data-command-list-item
          disabled={isAlreadyActive}
          fontSize={1}
          justify="flex-start"
          mode="bleed"
          onClick={isAlreadyActive ? undefined : handleClick}
          onMouseDown={onChildMouseDown}
          tabIndex={-1}
          tone={item?.tone}
        >
          <FilterDetails filter={item.filter} />
        </Button>
      </FilterTooltip>
    </Box>
  )
})
