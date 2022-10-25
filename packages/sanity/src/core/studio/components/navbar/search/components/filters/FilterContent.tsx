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
        // padding={3}
        style={{
          maxHeight: '600px',
          maxWidth: '350px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {filter.type === 'compound' && createElement(FILTERS.compound[filter.id].content, {filter})}

        {filter.type === 'field' && (
          <Box>
            <FieldFilterForm filter={filter} title={filter.path.join(' / ')} />

            {/* Debug */}
            <Card borderTop overflow="hidden" padding={3}>
              <Stack space={2}>
                <Code size={0}>Path: {filter.fieldPath}</Code>
                <Code size={0}>Operator: {filter.operatorType}</Code>
                <Code size={0}>Field type: {filter.fieldType}</Code>
                <Code size={0}>
                  Value: {typeof filter?.value === 'undefined' ? '' : JSON.stringify(filter.value)}
                </Code>
              </Stack>
            </Card>
          </Box>
        )}
      </Flex>
    </FilterPopoverWrapper>
  )
}
