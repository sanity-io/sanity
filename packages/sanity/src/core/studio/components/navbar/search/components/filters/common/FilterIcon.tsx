import {UnknownIcon} from '@sanity/icons'

import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {type SearchFilter} from '../../../types'

interface FilterIconProps {
  filter: SearchFilter
}

export function FilterIcon({filter}: FilterIconProps) {
  const {
    state: {definitions},
  } = useSearchState()

  const Icon = getFilterDefinition(definitions.filters, filter.filterName)?.icon
  if (Icon) {
    return <Icon />
  }
  return <UnknownIcon />
}
