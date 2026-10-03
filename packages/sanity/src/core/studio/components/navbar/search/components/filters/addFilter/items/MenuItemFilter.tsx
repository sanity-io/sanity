import {
  // oxlint-disable-next-line no-restricted-imports
  Button, // Button with specific styling and children.
} from '@sanity/ui'
import {memo, useCallback} from 'react'
import {Box, type MarginProps, type PaddingProps} from 'ui5'

import {useSearchSelector, useSearchState} from '../../../../contexts/search/useSearchState'
import {type FilterMenuItemFilter} from '../../../../types'
import {getFilterKey} from '../../../../utils/filterUtils'
import {FilterDetails} from '../../common/FilterDetails'
import {FilterTooltip} from './FilterTooltip'

interface FilterMenuItemProps extends MarginProps, PaddingProps {
  item: FilterMenuItemFilter
  onClose: () => void
}

export const MenuItemFilter = memo(function MenuItemFilter({
  item,
  onClose,
  ...rest
}: FilterMenuItemProps) {
  const {searchActorRef} = useSearchState()
  const filterKey = getFilterKey(item.filter)
  const isAlreadyActive = useSearchSelector((snapshot) =>
    snapshot.context.filters.some((filter) => getFilterKey(filter) === filterKey),
  )

  const handleClick = useCallback(() => {
    searchActorRef.send({filter: item.filter, type: 'TERMS_FILTERS_ADD'})
    onClose?.()
  }, [item.filter, onClose, searchActorRef])

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
