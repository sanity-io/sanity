import React, {useMemo} from 'react'
import {getFilterDefinition} from '../../../definitions/filters'
import type {SearchFilter} from '../../../types'

interface FilterTitleProps {
  filter: SearchFilter
}

export function FilterTitle({filter}: FilterTitleProps) {
  const title = useMemo(() => {
    // Display field path title, if present.
    // Otherwise fallback and display filter definition title.
    if (filter.fieldPath) {
      return filter.titlePath[filter.titlePath.length - 1]
    }
    return getFilterDefinition(filter.filterType)?.title
  }, [filter])

  return <span>{title}</span>
}
