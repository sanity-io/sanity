import {UnknownIcon} from '@sanity/icons/Unknown'
import {Icon} from 'ui5'

import {selectDefinitions} from '../../../contexts/search/searchSelectors'
import {useSearchSelector} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {type SearchFilter} from '../../../types'

interface FilterIconProps {
  filter: SearchFilter
}

export function FilterIcon({filter}: FilterIconProps) {
  const definitions = useSearchSelector(selectDefinitions)

  const filterIcon = getFilterDefinition(definitions.filters, filter.filterName)?.icon
  return (
    <Icon
      size={1}
      icon={filterIcon ?? UnknownIcon}
      style={{margin: '-0.375rem', color: 'var(--card-fg-color)'}}
    />
  )
}
