import {UnknownIcon} from '@sanity/icons'
import React, {ComponentType, createElement} from 'react'
import {FILTERS} from '../../config/filters'
import type {SearchFilter} from '../../types'

interface FilterIconProps {
  filter: SearchFilter
}

export function FilterIcon({filter}: FilterIconProps) {
  let icon: ComponentType | null = null
  if (filter.type === 'compound') {
    icon = FILTERS.compound[filter.id]?.icon
  }
  if (filter.type === 'field') {
    icon = FILTERS.field[filter.fieldType]?.icon
  }

  if (icon) {
    return createElement(icon)
  }
  return <UnknownIcon />
}
