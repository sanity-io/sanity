import {Card, Code, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import {DEBUG_MODE} from '../../../constants'
import type {ValidatedSearchFilter} from '../../../types'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {FilterForm} from './FilterForm'

interface FilterPopoverContentProps {
  filter: ValidatedSearchFilter
  onClose: () => void
}

export function FilterPopoverContent({filter, onClose}: FilterPopoverContentProps) {
  return (
    <FilterPopoverWrapper onClose={onClose}>
      <Flex
        direction="column"
        style={{
          maxHeight: '600px',
          maxWidth: '350px',
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
    </FilterPopoverWrapper>
  )
}

function DebugDocumentTypes({filter}: {filter: ValidatedSearchFilter}) {
  return (
    <Card borderTop overflow="hidden" padding={3} tone="transparent">
      <Stack space={2}>
        <Text size={0} weight="semibold">
          Document types
        </Text>
        <Code muted size={0} style={{whiteSpace: 'normal'}}>
          {filter.documentTypes ? filter.documentTypes?.join(', ') : '(all)'}
        </Code>
      </Stack>
    </Card>
  )
}

function DebugValues({filter}: {filter: ValidatedSearchFilter}) {
  return (
    <Card borderTop overflow="hidden" padding={3} tone="transparent">
      <Stack space={2}>
        <Text size={0} weight="semibold">
          Field
        </Text>
        {filter?.fieldPath && <Code size={0}>fieldPath: {filter.fieldPath}</Code>}
        <Code size={0}>filterType: {filter.filterType}</Code>
        <Code size={0}>operatorType: {filter.operatorType}</Code>
        <Code size={0}>
          value: {typeof filter?.value === 'undefined' ? '' : JSON.stringify(filter.value)}
        </Code>
      </Stack>
    </Card>
  )
}
