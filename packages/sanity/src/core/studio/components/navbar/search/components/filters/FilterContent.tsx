import {Card, Code, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import {FILTERS} from '../../config/filters'
import type {KeyedSearchFilter} from '../../types'
import {FilterForm} from './FilterForm'
import {FilterPopoverWrapper} from './FilterPopoverWrapper'

interface FilterContentProps {
  filter: KeyedSearchFilter
  onClose: () => void
}

export function FilterContent({filter, onClose}: FilterContentProps) {
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
        {filter.type === 'compound' && (
          <>
            <FilterForm filter={filter} title={FILTERS.compound[filter.id].title} />

            {/* Debug */}
            {/*
            <Card borderTop overflow="hidden" padding={3} tone="transparent">
              <Stack space={2}>
                <Text size={0} weight="semibold">
                  Compound
                </Text>
                <Code size={0}>id: {filter.id}</Code>
                <Code size={0}>
                  value: {typeof filter?.value === 'undefined' ? '' : JSON.stringify(filter.value)}
                </Code>
              </Stack>
            </Card>
            */}
          </>
        )}

        {filter.type === 'field' && (
          <>
            <FilterForm filter={filter} title={filter.path.join(' / ')} />

            {/* Debug */}
            {/*
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
            */}
          </>
        )}

        {/* Debug */}
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
      </Flex>
    </FilterPopoverWrapper>
  )
}
