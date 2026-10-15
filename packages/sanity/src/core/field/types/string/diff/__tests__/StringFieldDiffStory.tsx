import {type StringSchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {DiffString} from '../../../../diff/components/DiffString'
import {type StringDiff} from '../../../../types'
import {StringFieldDiff} from '../StringFieldDiff'

const STATUS_SCHEMA = {
  name: 'status',
  title: 'Status',
  jsonType: 'string',
  options: {list: ['draft', 'published']},
} as StringSchemaType

const MIXED: StringDiff = {
  type: 'string',
  action: 'changed',
  isChanged: true,
  fromValue: 'Hello world',
  toValue: 'Hello sanity',
  annotation: null,
  segments: [
    {type: 'stringSegment', action: 'unchanged', text: 'Hello '},
    {type: 'stringSegment', action: 'removed', text: 'world', annotation: null},
    {type: 'stringSegment', action: 'added', text: 'sanity', annotation: null},
  ],
}

const ADDED: StringDiff = {
  type: 'string',
  action: 'added',
  isChanged: true,
  fromValue: undefined,
  toValue: 'Brand new title',
  annotation: null,
  segments: [{type: 'stringSegment', action: 'added', text: 'Brand new title', annotation: null}],
}

const UNCHANGED: StringDiff = {
  type: 'string',
  action: 'unchanged',
  isChanged: false,
  fromValue: 'Same text',
  toValue: 'Same text',
  segments: [{type: 'stringSegment', action: 'unchanged', text: 'Same text'}],
}

const LIST_CHANGED: StringDiff = {
  type: 'string',
  action: 'changed',
  isChanged: true,
  fromValue: 'draft',
  toValue: 'published',
  annotation: null,
  segments: [
    {type: 'stringSegment', action: 'removed', text: 'draft', annotation: null},
    {type: 'stringSegment', action: 'added', text: 'published', annotation: null},
  ],
}

/**
 * Chromatic sentinel for review-changes string paint: DiffString ins/del
 * segments (pre-wrap, styled Text) and the enum-list FromTo branch.
 * Annotations stay null so DiffCard tooltips do not mount relative time.
 */
export function StringFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              mixed segments
            </Text>
            <DiffString diff={MIXED} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              added
            </Text>
            <DiffString diff={ADDED} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              unchanged
            </Text>
            <DiffString diff={UNCHANGED} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              list from-to
            </Text>
            <StringFieldDiff diff={LIST_CHANGED} schemaType={STATUS_SCHEMA} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
