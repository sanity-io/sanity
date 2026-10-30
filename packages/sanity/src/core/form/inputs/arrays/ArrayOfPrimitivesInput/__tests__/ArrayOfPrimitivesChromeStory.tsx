import {type ArraySchemaType, type FormNodeValidation} from '@sanity/types'
import {Card} from '@sanity/ui'
import {ArrayValidationContext} from 'sanity/_singletons'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ArrayOfPrimitivesFunctions} from '../ArrayOfPrimitivesFunctions'
import {NoItemsPlaceholder} from '../NoItemsPlaceholder'

const NOOP = () => undefined

const STRING_MEMBER = {name: 'string', title: 'String', jsonType: 'string'} as const
const NUMBER_MEMBER = {name: 'number', title: 'Number', jsonType: 'number'} as const

const SINGLE_TYPE = {
  name: 'tags',
  jsonType: 'array',
  of: [STRING_MEMBER],
} as ArraySchemaType

const MULTI_TYPE = {
  name: 'values',
  jsonType: 'array',
  of: [STRING_MEMBER, NUMBER_MEMBER],
} as ArraySchemaType

const REQUIRED_ERROR: FormNodeValidation[] = [{level: 'error', message: 'Required', path: ['tags']}]

const MAX_REACHED = {maxReached: true, maxReachedReason: 'Maximum number of items reached'}

function PrimitiveFunctions({
  schemaType,
  readOnly,
}: {
  schemaType: ArraySchemaType
  readOnly?: boolean
}) {
  return (
    <ArrayOfPrimitivesFunctions
      onChange={NOOP}
      onItemAppend={NOOP}
      onItemPrepend={NOOP}
      onValueCreate={() => ''}
      path={['tags']}
      readOnly={readOnly}
      schemaType={schemaType}
      value={[]}
    />
  )
}

/**
 * Chromatic sentinel for primitive-array chrome after the ui5 Grid/Text
 * migration: Add-item buttons (single type, multi-type, read-only, max
 * reached) and the empty-state Card (default copy, critical tone). Menus
 * stay closed. Shared with Storybook via a thin CSF wrapper.
 */
export function ArrayOfPrimitivesChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              add single type
            </Text>
            <PrimitiveFunctions schemaType={SINGLE_TYPE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              add multiple types
            </Text>
            <PrimitiveFunctions schemaType={MULTI_TYPE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              read only
            </Text>
            <PrimitiveFunctions readOnly schemaType={SINGLE_TYPE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              max reached
            </Text>
            <ArrayValidationContext value={MAX_REACHED}>
              <PrimitiveFunctions schemaType={SINGLE_TYPE} />
            </ArrayValidationContext>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              empty
            </Text>
            <NoItemsPlaceholder schemaType={SINGLE_TYPE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              empty with error
            </Text>
            <NoItemsPlaceholder schemaType={SINGLE_TYPE} validation={REQUIRED_ERROR} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
