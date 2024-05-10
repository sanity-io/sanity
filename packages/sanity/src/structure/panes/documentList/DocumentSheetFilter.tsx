import {Flex} from '@sanity/ui'
import {useSearchState, useTranslation} from 'sanity'

import {Filters} from '../../../core/studio/components/navbar/search/components/filters/Filters'
import {SearchHeader} from '../../../core/studio/components/navbar/search/components/SearchHeader'
import {hasSearchableTerms} from '../../../core/studio/components/navbar/search/utils/hasSearchableTerms'

export function DocumentSheetFilter() {
  const {t} = useTranslation()
  const {
    state: {filtersVisible, terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})
  return (
    <Flex>
      <SearchHeader
        ariaInputLabel={
          hasValidTerms
            ? t('search.search-results-aria-label')
            : t('search.recent-searches-aria-label')
        }
      />
      {filtersVisible && <Filters showTypeFilter={false} />}
    </Flex>
  )
}
