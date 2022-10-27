import {Card, Code, Stack} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {isNonNullable} from '../../../../../../util'
import {OPERATORS} from '../../config/operators'
import {useSearchState} from '../../contexts/search/useSearchState'
import type {SearchFilter} from '../../types'

export function DebugFilterQuery() {
  const {
    state: {
      terms: {filters},
    },
  } = useSearchState()

  const [filterQueries, setFilterQueries] = useState<string[]>([])

  useEffect(() => {
    setFilterQueries(generateFilterQuery(filters))
  }, [filters])

  if (filterQueries.length < 1) {
    return null
  }

  return (
    <Card padding={4} tone="transparent">
      <Stack space={3}>
        {filterQueries.map((query, index) => (
          <Code key={index} size={2}>
            {query}
          </Code>
        ))}
      </Stack>
    </Card>
  )
}

function generateFilterQuery(filters: SearchFilter[]) {
  const query = filters
    .map((filter) => {
      if (filter.type === 'field') {
        // TODO: correctly type
        let value = filter.value
        if (filter.operatorType) {
          const fn = OPERATORS[filter.operatorType].fn
          if (value !== null && value !== undefined) {
            value = JSON.stringify(value)
          }
          return fn(value, filter.fieldPath)
        }
      }
      return null
    })
    .filter(isNonNullable)

  return query
}
