import {Card, Code, Stack, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {isNonNullable} from '../../../../../../../util'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getOperator} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'

export function DebugFilterQuery() {
  const {
    state: {filters},
  } = useSearchState()

  const [filterQuery, setFilterQuery] = useState<string>()

  useEffect(() => {
    setFilterQuery(generateFilterQuery(filters))
  }, [filters])

  if (!filterQuery) {
    return null
  }

  return (
    <Card padding={4} tone="transparent">
      <Stack space={3}>
        <Text size={1} weight="semibold">
          Filter
        </Text>
        {filterQuery && <Code size={1}>{filterQuery}</Code>}
      </Stack>
    </Card>
  )
}

function generateFilterQuery(filters: SearchFilter[]) {
  const query = filters
    .map((filter) =>
      getOperator(filter.operatorType)?.fn({
        fieldPath: filter?.fieldPath,
        value: filter?.value,
      })
    )
    .filter(isNonNullable)
    .join(' && ')

  return query
}
