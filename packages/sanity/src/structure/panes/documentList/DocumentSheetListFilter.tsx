import {Flex} from '@sanity/ui'
import {useSearchState, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Filters} from '../../../core/studio/components/navbar/search/components/filters/Filters'
import {SearchHeader} from '../../../core/studio/components/navbar/search/components/SearchHeader'
import {hasSearchableTerms} from '../../../core/studio/components/navbar/search/utils/hasSearchableTerms'

const SearchContainer = styled(Flex)`
  flex-shrink: 0;
`
export function DocumentSheetFilter() {
  const {t} = useTranslation()
  const {
    state: {filtersVisible, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})
  return (
    <SearchContainer>
      <SearchHeader
        ariaInputLabel={
          hasValidTerms
            ? t('search.search-results-aria-label')
            : t('search.recent-searches-aria-label')
        }
      />
      {filtersVisible && <Filters showTypeFilter={false} />}
    </SearchContainer>
  )
}
