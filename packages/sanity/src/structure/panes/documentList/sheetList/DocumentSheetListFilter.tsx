import {Flex} from '@sanity/ui'
import {Filters, SearchHeader, useSearchState, useTranslation} from 'sanity'
import {styled} from 'styled-components'

const SearchContainer = styled(Flex)`
  flex-shrink: 0;
`

export function DocumentSheetListFilter() {
  const {
    state: {filtersVisible},
  } = useSearchState()
  const {t} = useTranslation()

  return (
    <SearchContainer>
      <SearchHeader placeholder={t('sheet-list.search.placeholder')} />
      {filtersVisible && <Filters showTypeFilter={false} />}
    </SearchContainer>
  )
}
