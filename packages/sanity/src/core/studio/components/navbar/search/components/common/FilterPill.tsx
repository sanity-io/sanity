import {Card} from '@sanity/ui'

import {type SearchFilter} from '../../types'
import {FilterLabel} from './FilterLabel'
import {filterPillCard} from './FilterPill.css'

interface FilterPillProps {
  filter: SearchFilter
}

export function FilterPill({filter}: FilterPillProps) {
  return (
    <Card border className={filterPillCard} padding={2} radius={2} tone="primary">
      <FilterLabel filter={filter} />
    </Card>
  )
}
