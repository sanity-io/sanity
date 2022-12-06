import {Box, Button, ResponsiveMarginProps, ResponsivePaddingProps} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import type {FilterMenuItemFilter} from '../../../../types'
import {getFilterKey} from '../../../../utils/filterUtils'
import {CommandListItem} from '../../../commandList/CommandListItem.styled'
import {useCommandList} from '../../../commandList/useCommandList'
import {FilterDetails} from '../../common/FilterDetails'
import {FilterTooltip} from './FilterTooltip'

interface FilterMenuItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  index: number | null
  item: FilterMenuItemFilter
  onClose: () => void
}

export const MenuItemFilter = React.memo(function MenuItemFilter({
  index,
  item,
  onClose,
  ...rest
}: FilterMenuItemProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const {
    dispatch,
    state: {filters},
  } = useSearchState()

  const {onChildMouseDown, onChildMouseEnter} = useCommandList()

  const handleClick = useCallback(() => {
    dispatch({filter: item.filter, type: 'TERMS_FILTERS_ADD'})
    onClose?.()
  }, [dispatch, item.filter, onClose])

  const isAlreadyActive = !!filters.find((f) => getFilterKey(f) === getFilterKey(item.filter))

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleMouseEnter = useCallback(() => {
    if (index !== null) {
      onChildMouseEnter(index)()
    }
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
    <Box {...rest}>
      <Button
        as={CommandListItem}
        data-command-list-item
        disabled={isAlreadyActive}
        fontSize={1}
        justify="flex-start"
        mode="bleed"
        onClick={isAlreadyActive ? undefined : handleClick}
        onMouseDown={onChildMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        padding={0}
        style={{position: 'relative'}}
        tabIndex={-1}
        tone={item?.tone}
      >
        <FilterTooltip
          fieldDefinition={item.fieldDefinition}
          filterDefinition={item.filterDefinition}
          visible={tooltipEnabled && tooltipVisible}
        >
          <Box padding={3}>
            <FilterDetails filter={item.filter} />
          </Box>
        </FilterTooltip>
      </Button>
    </Box>
  )
})
