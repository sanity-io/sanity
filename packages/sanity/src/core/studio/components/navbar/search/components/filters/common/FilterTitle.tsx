import React, {useMemo} from 'react'
import {getFilter} from '../../../definitions/filters'
import type {SearchFilterState} from '../../../types'

interface FilterTitleProps {
  filter: SearchFilterState
}

export function FilterTitle({filter}: FilterTitleProps) {
  const title = useMemo(() => {
    // Display field path title, if present.
    // Otherwise fallback and display filter definition title.
    if (filter.fieldPath) {
      return filter.path[filter.path.length - 1]
    }
    return getFilter(filter.filterType)?.title
  }, [filter])

  return <span>{title}</span>
}
