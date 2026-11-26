import {Flex} from 'ui5'

import {type SearchFilter} from '../../../types'
import {FilterForm} from './FilterForm'
import {containerFlex} from './FilterPopoverContent.css'

interface FilterPopoverContentProps {
  filter: SearchFilter
}

export function FilterPopoverContent({filter}: FilterPopoverContentProps) {
  return (
    <Flex className={containerFlex} flexDirection="column">
      <FilterForm filter={filter} />
    </Flex>
  )
}
