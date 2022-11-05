import {UnknownIcon} from '@sanity/icons'
import React, {createElement} from 'react'
import {getFilter} from '../../../definitions/filters'
import type {SearchFilterState} from '../../../types'

interface FilterIconProps {
  filter: SearchFilterState
}

export function FilterIcon({filter}: FilterIconProps) {
  const icon = getFilter(filter.filterType)?.icon
  if (icon) {
    return createElement(icon)
  }
  return <UnknownIcon />
}
