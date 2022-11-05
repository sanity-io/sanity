import {Card, Code, Stack, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {isNonNullable} from '../../../../../../../util'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getOperator} from '../../../definitions/operators'
import type {SearchFilterState} from '../../../types'

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
        <Text size={1} weight="semibold">
          Filters
        </Text>
        {filterQueries.map((query, index) => (
          <Code
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            size={1}
          >
            {query}
          </Code>
        ))}
      </Stack>
    </Card>
  )
}

function generateFilterQuery(filters: SearchFilterState[]) {
  const query = filters
    .map((filter) =>
      getOperator(filter.operatorType)?.fn({
        fieldPath: filter?.fieldPath,
        value: filter?.value,
      })
    )
    .filter(isNonNullable)

  return query
}
