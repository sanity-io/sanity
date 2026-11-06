import {type SchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../../contexts/search/SearchProvider'
import {type SearchFilter} from '../../../types'
import {DocumentTypesPill} from '../DocumentTypesPill'
import {FilterLabel} from '../FilterLabel'
import {FilterPill} from '../FilterPill'

// DocumentTypesPill only reads `name` / `title`.
function typeStub(name: string, title: string): SchemaType {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- story fixture, not a real schema
  return {jsonType: 'object', name, title} as SchemaType
}

const AUTHOR = typeStub('author', 'Author')
const ARTICLE = typeStub('article', 'Article')
const CATEGORY = typeStub('category', 'Category')
const REVIEW = typeStub('review', 'Editorial Review')
const GALLERY = typeStub('gallery', 'Image Gallery')

const BOOLEAN_FILTER: SearchFilter = {
  fieldId: 'boolean-title-Title',
  filterName: 'boolean',
  operatorType: 'booleanEqual',
  value: true,
}

const SEARCH_SCHEMA = [
  {
    fields: [{name: 'title', type: 'boolean'}],
    name: 'test',
    type: 'document',
  },
]

/**
 * Chromatic sentinel for global-search type and filter pills. DocumentTypesPill
 * is still on `@sanity/ui` Card + muted Text (all-types / short list /
 * "+N more" truncation). FilterPill wraps the same Card in primary tone around
 * FilterLabel's ui5 Flex/Box + TextWithTone ellipsis. TypeScript will not
 * catch Card radius/tone or truncation width. Copy is studio i18n (no queries).
 */
export function DocumentTypesPillStory() {
  return (
    <TestWrapper schemaTypes={SEARCH_SCHEMA}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              all types
            </Text>
            <DocumentTypesPill types={[]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              two types
            </Text>
            <DocumentTypesPill types={[AUTHOR, ARTICLE]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              truncated
            </Text>
            <DocumentTypesPill
              availableCharacters={18}
              types={[AUTHOR, ARTICLE, CATEGORY, REVIEW, GALLERY]}
            />
          </VStack>
          <SearchProvider>
            <VStack gap={5}>
              <VStack gap={2}>
                <Text muted size={1} weight="medium">
                  filter pill
                </Text>
                <FilterPill filter={BOOLEAN_FILTER} />
              </VStack>
              <VStack gap={2}>
                <Text muted size={1} weight="medium">
                  filter label field only
                </Text>
                <FilterLabel filter={BOOLEAN_FILTER} showContent={false} />
              </VStack>
            </VStack>
          </SearchProvider>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
