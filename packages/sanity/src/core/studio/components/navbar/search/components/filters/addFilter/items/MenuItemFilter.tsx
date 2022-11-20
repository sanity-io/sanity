import {Box, Button} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import styled from 'styled-components'
import {useCommandList} from '../../../../contexts/commandList'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import type {FilterMenuItemFilter} from '../../../../types'
import {getFilterKey} from '../../../../utils/filterUtils'
import {FilterDetails} from '../../common/FilterDetails'
import {FilterTooltip} from './FilterTooltip'

interface FilterMenuItemProps {
  index: number
  item: FilterMenuItemFilter
  onClose: () => void
}

const MenuItemFilterButton = styled(Button)`
  white-space: normal;
  width: 100%;
  [data-active='true'] & {
    // TODO: investigate issue where this background isn't respected after switching studio theme _multiple_ times (at least twice)
    background: ${({theme}) => theme.sanity.color.button.bleed.default.hovered.bg};
    // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
    box-shadow: none;
  }
`

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
        <MenuItemFilterButton
          disabled={isAlreadyActive}
          fontSize={1}
          justify="flex-start"
          mode="bleed"
          onClick={handleClick}
          onMouseDown={onChildMouseDown}
          tabIndex={-1}
          tone={item?.tone}
        >
          <FilterDetails filter={item.filter} />
        </MenuItemFilterButton>
      </FilterTooltip>
    </Box>
  )
})
