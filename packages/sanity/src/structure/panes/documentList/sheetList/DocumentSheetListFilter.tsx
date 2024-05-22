import {Flex} from '@sanity/ui'
import {Filters, SearchHeader, useSearchState} from 'sanity'
import {styled} from 'styled-components'

const SearchContainer = styled(Flex)`
  flex-shrink: 0;
`

export function DocumentSheetListFilter() {
  const {
    state: {filtersVisible},
  } = useSearchState()

  return (
    <SearchContainer>
      <SearchHeader />
      {filtersVisible && <Filters showTypeFilter={false} />}
    </SearchContainer>
  )
}
