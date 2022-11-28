import {Card, Code, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import {DEBUG_MODE} from '../../../constants'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {SearchFilter} from '../../../types'
import {getFieldFromFilter} from '../../../utils/filterUtils'
import {FilterForm} from './FilterForm'

interface FilterPopoverContentProps {
  filter: SearchFilter
}

export function FilterPopoverContent({filter}: FilterPopoverContentProps) {
  return (
    <Flex
      direction="column"
      style={{
        maxHeight: '600px',
        maxWidth: '480px',
        minWidth: '200px',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <FilterForm filter={filter} />

      {/* Debug panels */}
      {DEBUG_MODE && (
        <>
          <DebugValues filter={filter} />
          <DebugDocumentTypes filter={filter} />
        </>
      )}
    </Flex>
  )
}

function DebugDocumentTypes({filter}: {filter: SearchFilter}) {
  const {
    state: {
      definitions: {fields},
    },
  } = useSearchState()
  const fieldDefinition = getFieldFromFilter(fields, filter)

  return (
    <Card borderTop overflow="hidden" padding={3} tone="transparent">
      <Stack space={2}>
        <Text size={0} weight="semibold">
          Document types
        </Text>
        <Code muted size={0} style={{whiteSpace: 'normal'}}>
          {fieldDefinition?.documentTypes && fieldDefinition.documentTypes.length > 0
            ? fieldDefinition.documentTypes?.join(', ')
            : '(all)'}
        </Code>
      </Stack>
    </Card>
  )
}

function DebugValues({filter}: {filter: SearchFilter}) {
  const {
    state: {definitions},
  } = useSearchState()
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)

  return (
    <Card borderTop overflow="hidden" padding={3} tone="transparent">
      <Stack space={2}>
        <Text size={0} weight="semibold">
          Field
        </Text>
        {fieldDefinition?.fieldPath && <Code size={0}>fieldPath: {fieldDefinition.fieldPath}</Code>}
        <Code size={0}>filterName: {filter.filterName}</Code>
        <Code size={0}>operatorType: {filter.operatorType}</Code>
        <Code size={0}>
          value: {typeof filter?.value === 'undefined' ? '' : JSON.stringify(filter.value)}
        </Code>
      </Stack>
    </Card>
  )
}
