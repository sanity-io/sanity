import {Flex} from '@sanity/ui'

import {DEBUG_MODE} from '../../../constants'
import {type SearchFilter} from '../../../types'
import {DebugDocumentTypes} from '../debug/_DebugDocumentTypes'
import {DebugFilterValues} from '../debug/_DebugFilterValues'
import {FilterForm} from './FilterForm'

import {containerFlex} from './FilterPopoverContent.css'

interface FilterPopoverContentProps {
  filter: SearchFilter
}

export function FilterPopoverContent({filter}: FilterPopoverContentProps) {
  return (
    <Flex className={containerFlex} direction="column">
      <FilterForm filter={filter} />

      {/* Debug panels */}
      {DEBUG_MODE && (
        <>
          <DebugFilterValues filter={filter} />
          <DebugDocumentTypes filter={filter} />
        </>
      )}
    </Flex>
  )
}
