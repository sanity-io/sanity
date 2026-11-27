import {type SchemaTypeDefinition} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../../../contexts/search/SearchProvider'
import {type SearchFilter} from '../../../../types'
import {FilterForm} from '../FilterForm'
import {FilterPopoverContent} from '../FilterPopoverContent'

const SCHEMA_TYPES: SchemaTypeDefinition[] = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'boolean'}],
  },
]

const BOOLEAN_TITLE_FILTER: SearchFilter = {
  fieldId: 'boolean-title-Title',
  filterName: 'boolean',
  operatorType: 'booleanEqual',
  value: true,
}

/**
 * Chromatic sentinel for the add-filter popover form after the
 * vanilla-extract container Flex landed. Default vs fullscreen pair
 * FilterDetails, the operator menu, the boolean value input, and the
 * fullscreen trash Button — a mix TypeScript will not catch. The schema
 * is a fixture document with a boolean Title field.
 */
export function SearchFilterFormStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              default
            </Text>
            <Card border>
              <SearchProvider>
                <FilterPopoverContent filter={BOOLEAN_TITLE_FILTER} />
              </SearchProvider>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              fullscreen
            </Text>
            <Card border>
              <SearchProvider fullscreen>
                <FilterForm filter={BOOLEAN_TITLE_FILTER} />
              </SearchProvider>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
