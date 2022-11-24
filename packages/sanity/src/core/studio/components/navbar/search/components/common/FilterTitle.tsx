import React, {useMemo} from 'react'
import {getFilterDefinition} from '../../definitions/filters'
import type {SearchFilter} from '../../types'
import {useSearchState} from '../../contexts/search/useSearchState'
import {getFieldFromFilter} from '../../utils/filterUtils'

interface FilterTitleProps {
  filter: SearchFilter
  maxLength?: number
}

export function FilterTitle({filter, maxLength}: FilterTitleProps) {
  const {
    state: {definitions},
  } = useSearchState()

  const title = useMemo(() => {
    const fieldDefinition = getFieldFromFilter(definitions.fields, filter)
    // Display field definition title path, if present.
    if (fieldDefinition?.titlePath) {
      return fieldDefinition.titlePath[fieldDefinition.titlePath.length - 1]
    }
    // Otherwise, fallback and display filter definition title.
    return getFilterDefinition(definitions.filters, filter.filterType)?.title
  }, [definitions, filter])

  if (!title) {
    return null
  }

  return maxLength && title.length > maxLength ? (
    <span>{title.slice(0, maxLength)}…</span>
  ) : (
    <span>{title}</span>
  )
}
