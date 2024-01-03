import {Card, Code, Stack} from '@sanity/ui'
import React from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {SearchFilter} from '../../../types'
import {getFieldFromFilter} from '../../../utils/filterUtils'

interface DebugFilterValuesProps {
  filter: SearchFilter
}

export function DebugFilterValues({filter}: DebugFilterValuesProps) {
  const {
    state: {definitions},
  } = useSearchState()
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)

  return (
    <Card borderTop padding={3} tone="transparent">
      <Stack space={2}>
        <Code size={0} weight="medium">
          Filter
        </Code>
        {fieldDefinition?.fieldPath && <Code size={0}>fieldPath: {fieldDefinition.fieldPath}</Code>}
        <Code muted size={0} style={{whiteSpace: 'normal'}}>
          filterName: {filter.filterName}
        </Code>
        <Code muted size={0} style={{whiteSpace: 'normal'}}>
          operatorType: {filter.operatorType}
        </Code>
        <Code muted size={0} style={{whiteSpace: 'normal'}}>
          value: {typeof filter?.value === 'undefined' ? '' : JSON.stringify(filter.value)}
        </Code>
      </Stack>
    </Card>
  )
}
