import {Card} from '@sanity/ui'
import React from 'react'
import type {SearchFilter} from '../../types'
import {FilterLabel} from './FilterLabel'

interface FilterPillProps {
  filter: SearchFilter
}

export function FilterPill({filter}: FilterPillProps) {
  return (
    <Card border padding={2} radius={2} tone="primary">
      <FilterLabel filter={filter} />
    </Card>
  )
}
