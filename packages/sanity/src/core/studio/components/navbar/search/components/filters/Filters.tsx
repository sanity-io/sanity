import {useCallback, useState} from 'react'
import {Flex} from 'ui5'

import {Button} from '../../../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../../../i18n/hooks/useTranslation'
import {DEBUG_MODE} from '../../constants'
import {selectFilters} from '../../contexts/search/searchSelectors'
import {useSearchSelector, useSearchState} from '../../contexts/search/useSearchState'
import {getFilterKey} from '../../utils/filterUtils'
import {AddFilterButton} from './addFilter/AddFilterButton'
import {DebugDocumentTypesNarrowed} from './debug/_DebugDocumentTypesNarrowed'
import {DebugFilterQuery} from './debug/_DebugFilterQuery'
import {DocumentTypesButton} from './documentTypes/DocumentTypesButton'
import {FilterButton} from './filter/FilterButton'

/**
 * @internal
 */
export function Filters({showTypeFilter = true}: {showTypeFilter?: boolean}) {
  const {fullscreen, searchActorRef} = useSearchState()
  const filters = useSearchSelector(selectFilters)
  const lastAddedFilter = useSearchSelector((snapshot) => snapshot.context.lastAddedFilter)
  const hasSelectedTypes = useSearchSelector((snapshot) => snapshot.context.terms.types.length > 0)
  const {t} = useTranslation()

  // Only filters added while mounted open their popover, not one added before the search reopened
  const [lastAddedFilterOnMount] = useState(lastAddedFilter)
  const newFilterKey =
    lastAddedFilter && lastAddedFilter !== lastAddedFilterOnMount
      ? getFilterKey(lastAddedFilter)
      : null

  const handleClear = useCallback(() => {
    if (showTypeFilter) searchActorRef.send({type: 'TERMS_TYPES_CLEAR'})
    searchActorRef.send({type: 'TERMS_FILTERS_CLEAR'})
  }, [searchActorRef, showTypeFilter])

  const clearFiltersButtonVisible = filters.length > 0 || (showTypeFilter && hasSelectedTypes)

  const clearFiltersButton = (
    <Button
      mode="bleed"
      onClick={handleClear}
      size={fullscreen ? 'large' : 'default'}
      text={t('search.action.clear-filters')}
      tone="critical"
    />
  )

  return (
    <>
      <Flex alignItems="flex-start" gap={3} justifyContent="space-between" padding={2}>
        <Flex flexBasis="0%" flexGrow={1} gap={2} flexWrap="wrap">
          {showTypeFilter && <DocumentTypesButton />}
          {filters?.map((filter) => {
            const key = getFilterKey(filter)
            return <FilterButton key={key} filter={filter} initialOpen={newFilterKey === key} />
          })}
          {!fullscreen && <AddFilterButton />}
        </Flex>
        {clearFiltersButtonVisible && !fullscreen && clearFiltersButton}
      </Flex>

      {fullscreen && (
        <Flex justifyContent="space-between" paddingBottom={2} paddingX={2}>
          <AddFilterButton />
          {clearFiltersButtonVisible && clearFiltersButton}
        </Flex>
      )}

      {/* Debug panels */}
      {DEBUG_MODE && (
        <>
          <DebugFilterQuery />
          <DebugDocumentTypesNarrowed />
        </>
      )}
    </>
  )
}
