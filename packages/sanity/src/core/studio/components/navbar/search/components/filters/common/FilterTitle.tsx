import React, {useMemo} from 'react'
import {getFilterDefinition} from '../../../definitions/filters'
import type {SearchFilter} from '../../../types'
import {useSearchState} from '../../../contexts/search/useSearchState'

interface FilterTitleProps {
  filter: SearchFilter
}

export function FilterTitle({filter}: FilterTitleProps) {
  const {
    state: {definitions},
  } = useSearchState()

  const title = useMemo(() => {
    // Display field path title, if present.
    // Otherwise, fallback and display filter definition title.
    if (filter.fieldPath) {
      return filter.titlePath[filter.titlePath.length - 1]
    }
    return getFilterDefinition(definitions.filters, filter.filterType)?.title
  }, [filter, definitions])

  return <span>{title}</span>
}
