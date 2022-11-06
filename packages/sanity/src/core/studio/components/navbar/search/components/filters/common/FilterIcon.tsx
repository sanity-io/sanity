import {UnknownIcon} from '@sanity/icons'
import React, {createElement} from 'react'
import {getFilterDefinition} from '../../../definitions/filters'
import type {SearchFilter} from '../../../types'

interface FilterIconProps {
  filter: SearchFilter
}

export function FilterIcon({filter}: FilterIconProps) {
  const icon = getFilterDefinition(filter.filterType)?.icon
  if (icon) {
    return createElement(icon)
  }
  return <UnknownIcon />
}
