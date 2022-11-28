import {UnknownIcon} from '@sanity/icons'
import React, {createElement} from 'react'
import {getFilterDefinition} from '../../../definitions/filters'
import type {SearchFilter} from '../../../types'
import {useSearchState} from '../../../contexts/search/useSearchState'

interface FilterIconProps {
  filter: SearchFilter
}

export function FilterIcon({filter}: FilterIconProps) {
  const {
    state: {definitions},
  } = useSearchState()

  const icon = getFilterDefinition(definitions.filters, filter.filterName)?.icon
  if (icon) {
    return createElement(icon)
  }
  return <UnknownIcon />
}
