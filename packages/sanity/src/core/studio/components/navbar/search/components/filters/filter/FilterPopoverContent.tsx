import {Card, Code, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import type {ValidatedFilter} from '../../../types'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {FilterForm} from './FilterForm'

interface FilterPopoverContentProps {
  filter: ValidatedFilter
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
        <DebugValues filter={filter} />
        <DebugDocumentTypes filter={filter} />
      </Flex>
    </FilterPopoverWrapper>
  )
}

function DebugDocumentTypes({filter}: {filter: ValidatedFilter}) {
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

function DebugValues({filter}: {filter: ValidatedFilter}) {
  return (
    <>
      {/* Debug */}
      {filter.type === 'custom' && (
        <Card borderTop overflow="hidden" padding={3} tone="transparent">
          <Stack space={2}>
            <Text size={0} weight="semibold">
              Custom
            </Text>
            <Code size={0}>id: {filter.id}</Code>
            <Code size={0}>
              value: {typeof filter?.value === 'undefined' ? '' : JSON.stringify(filter.value)}
            </Code>
          </Stack>
        </Card>
      )}

      {/* Debug */}
      {filter.type === 'field' && (
        <Card borderTop overflow="hidden" padding={3} tone="transparent">
          <Stack space={2}>
            <Text size={0} weight="semibold">
              Field
            </Text>
            <Code size={0}>fieldPath: {filter.fieldPath}</Code>
            <Code size={0}>fieldType: {filter.fieldType}</Code>
            <Code size={0}>operatorType: {filter.operatorType}</Code>
            <Code size={0}>
              value: {typeof filter?.value === 'undefined' ? '' : JSON.stringify(filter.value)}
            </Code>
          </Stack>
        </Card>
      )}
    </>
  )
}
