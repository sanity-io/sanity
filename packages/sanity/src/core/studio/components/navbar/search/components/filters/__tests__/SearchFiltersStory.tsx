import {defineField, defineType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../../contexts/search/SearchProvider'
import {Filters} from '../Filters'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'author',
    title: 'Author',
    fields: [defineField({type: 'string', name: 'name', title: 'Name'})],
  }),
]

/**
 * Chromatic sentinel for the global-search filter chip row after the ui5
 * Flex wrap migration. Compact keeps Add filter beside All types; fullscreen
 * moves Add filter onto a second row. Popovers stay closed. Copy comes from
 * the studio locale bundle (no live queries).
 */
export function SearchFiltersStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{maxWidth: 520}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              compact
            </Text>
            <Card border radius={2}>
              <SearchProvider>
                <Filters />
              </SearchProvider>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              fullscreen
            </Text>
            <Card border radius={2}>
              <SearchProvider fullscreen>
                <Filters />
              </SearchProvider>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
