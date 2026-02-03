import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import {type SearchFilter} from '../../../types'
import {UnknownIcon} from '@sanity/icons'

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
