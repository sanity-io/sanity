import {
  Box,
  ResponsiveMarginProps,
  ResponsivePaddingProps,
  // eslint-disable-next-line no-restricted-imports
  Button, // Button with specific styling and children.
} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import type {FilterMenuItemFilter} from '../../../../types'
import {getFilterKey} from '../../../../utils/filterUtils'
import {FilterDetails} from '../../common/FilterDetails'
import {FilterTooltip} from './FilterTooltip'

interface FilterMenuItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  item: FilterMenuItemFilter
  onClose: () => void
}

export const MenuItemFilter = React.memo(function MenuItemFilter({
  item,
  onClose,
  ...rest
}: FilterMenuItemProps) {
  const {
    dispatch,
    state: {filters},
  } = useSearchState()

  const handleClick = useCallback(() => {
    dispatch({filter: item.filter, type: 'TERMS_FILTERS_ADD'})
    onClose?.()
  }, [dispatch, item.filter, onClose])

  const isAlreadyActive = !!filters.find((f) => getFilterKey(f) === getFilterKey(item.filter))

  // Only enable tooltips if an associated field definition exists, or the filter has a valid description
  const tooltipEnabled = !!(item.fieldDefinition || item.filterDefinition.description)

  return (
    <Box {...rest}>
      <Button
        disabled={isAlreadyActive}
        fontSize={1}
        justify="flex-start"
        mode="bleed"
        onClick={isAlreadyActive ? undefined : handleClick}
        padding={0}
        style={{position: 'relative', whiteSpace: 'normal', width: '100%'}}
        tabIndex={-1}
        tone={item?.tone}
      >
        <FilterTooltip
          fieldDefinition={item.fieldDefinition}
          filterDefinition={item.filterDefinition}
          visible={tooltipEnabled}
        >
          <Box padding={3}>
            <FilterDetails filter={item.filter} />
          </Box>
        </FilterTooltip>
      </Button>
    </Box>
  )
})
