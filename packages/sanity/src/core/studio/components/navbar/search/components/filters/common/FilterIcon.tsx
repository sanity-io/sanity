import {UnknownIcon} from '@sanity/icons/Unknown'

import {selectDefinitions} from '../../../contexts/search/searchSelectors'
import {useSearchSelector} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {type SearchFilter} from '../../../types'

interface FilterIconProps {
  filter: SearchFilter
}

export function FilterIcon({filter}: FilterIconProps) {
  const definitions = useSearchSelector(selectDefinitions)

  const Icon = getFilterDefinition(definitions.filters, filter.filterName)?.icon
  if (Icon) {
    return <Icon />
  }
  return <UnknownIcon />
}
