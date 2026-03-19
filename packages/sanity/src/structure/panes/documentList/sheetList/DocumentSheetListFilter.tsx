import {Flex} from '@sanity/ui'
import {Filters, SearchHeader, useSearchState} from 'sanity'

import {searchContainer} from './DocumentSheetListFilter.css'

export function DocumentSheetListFilter() {
  const {
    state: {filtersVisible},
  } = useSearchState()

  return (
    <Flex className={searchContainer}>
      <SearchHeader />
      {filtersVisible && <Filters showTypeFilter={false} />}
    </Flex>
  )
}
