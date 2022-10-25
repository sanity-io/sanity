import {Box, Card, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import React, {createElement} from 'react'
// import type {CompoundSearchFilter, FieldSearchFilter} from '../../../../../../search'
import {FILTERS} from '../../config/filters'
import type {SearchFilter} from '../../types'
import {FieldFilterForm} from './field/FieldFilterForm'
import {FilterPopoverWrapper} from './FilterPopoverWrapper'

interface FilterContentProps {
  filter: SearchFilter
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
            {createElement(FILTERS.compound[filter.id].content, {filter})}

            {/* Debug */}
            <Card borderTop overflow="hidden" padding={3} tone="default">
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
          </>
        )}

        {filter.type === 'field' && (
          <>
            <FieldFilterForm filter={filter} title={filter.path.join(' / ')} />

            {/* Debug */}
            <Card borderTop overflow="hidden" padding={3} tone="primary">
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
          </>
        )}
      </Flex>
    </FilterPopoverWrapper>
  )
}
