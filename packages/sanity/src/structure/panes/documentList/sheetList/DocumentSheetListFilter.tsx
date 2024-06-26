import {Flex} from '@sanity/ui'
import {Filters, SearchHeader, useSearchState, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {SheetListLocaleNamespace} from './i18n'

const SearchContainer = styled(Flex)`
  flex-shrink: 0;
`

export function DocumentSheetListFilter() {
  const {
    state: {filtersVisible},
  } = useSearchState()
  const {t} = useTranslation(SheetListLocaleNamespace)

  return (
    <SearchContainer>
      <SearchHeader placeholder={t('search.placeholder')} />
      {filtersVisible && <Filters showTypeFilter={false} />}
    </SearchContainer>
  )
}
