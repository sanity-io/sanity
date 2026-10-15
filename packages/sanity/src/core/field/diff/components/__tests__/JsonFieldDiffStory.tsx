import {type ObjectSchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type ObjectDiff} from '../../../types'
import {JsonFieldDiff} from '../JsonFieldDiff'

const UNKNOWN_SCHEMA = {
  name: 'unknown',
  title: 'Unknown',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

const CHANGED = {
  type: 'object',
  action: 'changed',
  isChanged: true,
  fromValue: {title: 'Draft headline'},
  toValue: {title: 'Live headline', featured: true},
  fields: {},
  annotation: null,
} as unknown as ObjectDiff

const ADDED = {
  type: 'object',
  action: 'added',
  isChanged: true,
  fromValue: undefined,
  toValue: {status: 'ready'},
  fields: {},
  annotation: null,
} as unknown as ObjectDiff

const REMOVED = {
  type: 'object',
  action: 'removed',
  isChanged: true,
  fromValue: {status: 'ready'},
  toValue: undefined,
  fields: {},
  annotation: null,
} as unknown as ObjectDiff

/**
 * Chromatic sentinel for review-changes unknown-schema JSON diffs after the
 * ui5 Flex / VStack migration. The caution card sits above from/to Code
 * blocks and a down FromToArrow — a spacing and tone mix TypeScript will
 * not catch. Fixture JSON only; annotations stay null so tooltips do not
 * render relative times.
 */
export function JsonFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              changed
            </Text>
            <JsonFieldDiff diff={CHANGED} schemaType={UNKNOWN_SCHEMA} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              added
            </Text>
            <JsonFieldDiff diff={ADDED} schemaType={UNKNOWN_SCHEMA} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              removed
            </Text>
            <JsonFieldDiff diff={REMOVED} schemaType={UNKNOWN_SCHEMA} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
