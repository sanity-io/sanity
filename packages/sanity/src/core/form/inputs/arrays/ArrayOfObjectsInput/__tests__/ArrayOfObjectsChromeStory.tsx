import {type ArraySchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {ArrayValidationContext} from 'sanity/_singletons'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ArrayOfObjectsFunctions} from '../ArrayOfObjectsFunctions'

const NOOP = () => undefined

const ARTICLE = {name: 'article', title: 'Article', jsonType: 'object'} as const
const AUTHOR = {name: 'author', title: 'Author', jsonType: 'object'} as const

const SINGLE_TYPE = {
  name: 'articles',
  jsonType: 'array',
  of: [ARTICLE],
} as ArraySchemaType

const MULTI_TYPE = {
  name: 'blocks',
  jsonType: 'array',
  of: [ARTICLE, AUTHOR],
} as ArraySchemaType

const MAX_REACHED = {maxReached: true, maxReachedReason: 'Maximum number of items reached'}

function ObjectFunctions({
  schemaType,
  readOnly,
}: {
  schemaType: ArraySchemaType
  readOnly?: boolean
}) {
  return (
    <ArrayOfObjectsFunctions
      onChange={NOOP}
      onItemAppend={NOOP}
      onItemPrepend={NOOP}
      onValueCreate={() => ({_type: 'article', _key: 'item-1'})}
      path={['articles']}
      readOnly={readOnly}
      schemaType={schemaType}
      value={[]}
    />
  )
}

/**
 * Chromatic sentinel for object-array add-item chrome after the ui5 Grid
 * migration: single-type Add, multi-type Add (menu closed), read-only, and
 * max-reached. Shared with Storybook via a thin CSF wrapper.
 */
export function ArrayOfObjectsChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              add single type
            </Text>
            <ObjectFunctions schemaType={SINGLE_TYPE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              add multiple types
            </Text>
            <ObjectFunctions schemaType={MULTI_TYPE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              read only
            </Text>
            <ObjectFunctions readOnly schemaType={SINGLE_TYPE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              max reached
            </Text>
            <ArrayValidationContext value={MAX_REACHED}>
              <ObjectFunctions schemaType={SINGLE_TYPE} />
            </ArrayValidationContext>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
