import {Card, Code, Stack} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {isNonNullable} from '../../../../../../util'
import {useSearchState} from '../../contexts/search/useSearchState'
import {OPERATORS} from '../../definitions/operators'
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
          <Code
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            size={2}
          >
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
      // TODO: fixme
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return OPERATORS[filter.operatorType].fn(filter)
    })
    .filter(isNonNullable)

  return query
}
