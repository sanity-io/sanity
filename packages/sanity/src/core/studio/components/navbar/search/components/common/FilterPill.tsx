import {Card} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import type {SearchFilter} from '../../types'
import {FilterLabel} from './FilterLabel'

interface FilterPillProps {
  filter: SearchFilter
}

const FilterPillCard = styled(Card)`
  cursor: default;
`

export function FilterPill({filter}: FilterPillProps) {
  return (
    <FilterPillCard border padding={2} radius={2} tone="primary">
      <FilterLabel filter={filter} />
    </FilterPillCard>
  )
}
