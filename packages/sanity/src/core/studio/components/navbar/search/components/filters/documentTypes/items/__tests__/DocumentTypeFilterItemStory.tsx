import {defineType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../../../../test/browser/TestWrapper'
import {createSchema} from '../../../../../../../../../schema/createSchema'
import {SearchProvider} from '../../../../../contexts/search/SearchProvider'
import {DocumentTypeFilterItem} from '../DocumentTypeFilterItem'

const SCHEMA_TYPES = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [{name: 'name', type: 'string'}],
  }),
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', type: 'string'}],
  }),
]

const fixtureSchema = createSchema({name: 'fixture', types: SCHEMA_TYPES})
const authorType = fixtureSchema.get('author')
const articleType = fixtureSchema.get('article')

if (!authorType || !articleType) {
  throw new Error('Expected author and article fixture types')
}

const AUTHOR = authorType
const ARTICLE = articleType

/**
 * Chromatic sentinel for the global-search document-type filter row after
 * the ui5 Box / Button migration. Unselected default bleed vs selected
 * primary + checkmark — a mix TypeScript will not catch. Titles are
 * fixtures; SearchProvider is required for the click dispatch only.
 */
export function DocumentTypeFilterItemStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{maxWidth: 320}}>
        <SearchProvider>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                unselected
              </Text>
              <DocumentTypeFilterItem selected={false} type={AUTHOR} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                selected
              </Text>
              <DocumentTypeFilterItem selected type={ARTICLE} />
            </VStack>
          </VStack>
        </SearchProvider>
      </Card>
    </TestWrapper>
  )
}
