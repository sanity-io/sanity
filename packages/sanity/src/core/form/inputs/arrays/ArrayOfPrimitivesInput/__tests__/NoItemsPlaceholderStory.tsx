import {type ArraySchemaType, type FormNodeValidation} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {NoItemsPlaceholder} from '../NoItemsPlaceholder'

const TAGS_SCHEMA = {
  name: 'tags',
  title: 'Tags',
  jsonType: 'array',
  of: [{name: 'string', jsonType: 'string'}],
} as ArraySchemaType

const ERROR: FormNodeValidation[] = [{level: 'error', message: 'Required', path: []}]

/**
 * Chromatic sentinel for the empty array-of-primitives Card: default muted
 * copy and critical tone when the field has errors. Shared with Storybook
 * via a thin CSF wrapper.
 */
export function NoItemsPlaceholderStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              default copy
            </Text>
            <NoItemsPlaceholder schemaType={TAGS_SCHEMA} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              field error
            </Text>
            <NoItemsPlaceholder schemaType={TAGS_SCHEMA} validation={ERROR} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
