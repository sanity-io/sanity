import {Flex} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {Button} from '../../../../../../../ui-components'
import {useTranslation} from '../../../../../../i18n'
import {DEBUG_MODE} from '../../constants'
import {useSearchState} from '../../contexts/search/useSearchState'
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
  const {
    dispatch,
    state: {
      filters,
      fullscreen,
      lastAddedFilter,
      terms: {types},
    },
  } = useSearchState()
  const {t} = useTranslation()

  const [isMounted, setIsMounted] = useState(false)

  const handleClear = useCallback(() => {
    if (showTypeFilter) dispatch({type: 'TERMS_TYPES_CLEAR'})
    dispatch({type: 'TERMS_FILTERS_CLEAR'})
  }, [dispatch, showTypeFilter])

  const clearFiltersButtonVisible = filters.length > 0 || (showTypeFilter && types.length > 0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const lastAddedFilterKey = lastAddedFilter && getFilterKey(lastAddedFilter)

  const ClearFiltersButton = () => (
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
      <Flex align="flex-start" gap={3} justify="space-between" padding={2}>
        <Flex flex={1} gap={2} wrap="wrap">
          {showTypeFilter && <DocumentTypesButton />}
          {filters?.map((filter) => {
            const key = getFilterKey(filter)
            return (
              <FilterButton
                filter={filter}
                initialOpen={isMounted && lastAddedFilterKey === key}
                key={key}
              />
            )
          })}
          {!fullscreen && <AddFilterButton />}
        </Flex>
        {clearFiltersButtonVisible && !fullscreen && <ClearFiltersButton />}
      </Flex>

      {fullscreen && (
        <Flex justify="space-between" paddingBottom={2} paddingX={2}>
          <AddFilterButton />
          {clearFiltersButtonVisible && <ClearFiltersButton />}
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
