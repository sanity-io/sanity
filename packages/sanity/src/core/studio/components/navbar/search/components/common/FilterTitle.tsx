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
    const filterDef = getFilterDefinition(definitions.filters, filter.filterName)
    switch (filterDef?.type) {
      case 'field': {
        const fieldDefinition = getFieldFromFilter(definitions.fields, filter)
        if (fieldDefinition?.titlePath) {
          return fieldDefinition.titlePath[fieldDefinition.titlePath.length - 1]
        }
        return null
      }
      case 'pinned':
        return filterDef.title
      default:
        return null
    }
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
