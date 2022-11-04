import {Button, Flex} from '@sanity/ui'
import React, {useCallback, useEffect, useRef} from 'react'
import {useSearchState} from '../../contexts/search/useSearchState'
import AddFilterButton from './addFilter/AddFilterButton'
import DocumentTypesButton from './documentTypes/DocumentTypesButton'
import FilterButton from './filter/FilterButton'

export function Filters() {
  const {
    dispatch,
    state: {
      lastAddedFilter,
      terms: {filters, types},
    },
  } = useSearchState()

  const isMounted = useRef(false)

  const handleClear = useCallback(() => {
    dispatch({type: 'TERMS_FILTERS_CLEAR'})
    dispatch({type: 'TERMS_TYPES_CLEAR'})
  }, [dispatch])

  const clearFiltersButtonVisible = filters.length > 0 || types.length > 0

  useEffect(() => {
    isMounted.current = true
  }, [])

  return (
    <Flex align="flex-start" gap={3} justify="space-between" padding={2}>
      <Flex flex={1} gap={2} wrap="wrap">
        <DocumentTypesButton />

        {filters?.map((filter) => (
          <FilterButton
            filter={filter}
            initialOpen={isMounted.current && lastAddedFilter?._key === filter._key}
            key={filter._key}
          />
        ))}

        <AddFilterButton />
      </Flex>

      {clearFiltersButtonVisible && (
        <Button
          fontSize={1}
          mode="bleed"
          onClick={handleClear}
          padding={2}
          text="Clear filters"
          tone="critical"
        />
      )}
    </Flex>
  )
}
