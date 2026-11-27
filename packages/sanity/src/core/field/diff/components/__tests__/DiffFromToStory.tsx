import {type StringSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type StringDiff} from '../../../types'
import {StringPreview} from '../../../types/string/preview/StringPreview'
import {DiffFromTo} from '../DiffFromTo'

const STRING_SCHEMA = {
  name: 'title',
  title: 'Title',
  jsonType: 'string',
} as StringSchemaType

const UNCHANGED: StringDiff = {
  type: 'string',
  action: 'unchanged',
  isChanged: false,
  fromValue: 'Same title',
  toValue: 'Same title',
  segments: [{type: 'stringSegment', action: 'unchanged', text: 'Same title'}],
}

const ADDED: StringDiff = {
  type: 'string',
  action: 'added',
  isChanged: true,
  fromValue: undefined,
  toValue: 'A new title',
  annotation: null,
  segments: [{type: 'stringSegment', action: 'added', text: 'A new title', annotation: null}],
}

const REMOVED: StringDiff = {
  type: 'string',
  action: 'removed',
  isChanged: true,
  fromValue: 'An old title',
  toValue: undefined,
  annotation: null,
  segments: [{type: 'stringSegment', action: 'removed', text: 'An old title', annotation: null}],
}

const CHANGED: StringDiff = {
  type: 'string',
  action: 'changed',
  isChanged: true,
  fromValue: 'Draft title',
  toValue: 'Published title',
  annotation: null,
  segments: [
    {type: 'stringSegment', action: 'removed', text: 'Draft title', annotation: null},
    {type: 'stringSegment', action: 'added', text: 'Published title', annotation: null},
  ],
}

/**
 * Chromatic sentinel for the review-changes from/to composition
 * (`DiffFromTo`) used by string-enum, number, datetime, slug, reference
 * and fallback diffs: unchanged (single card), added, removed, and
 * changed in both inline and grid layouts. StringPreview is the fixture
 * preview. DiffCard tooltips stay closed (no annotations).
 */
export function DiffFromToStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 560}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              unchanged
            </Text>
            <DiffFromTo
              diff={UNCHANGED}
              previewComponent={StringPreview}
              schemaType={STRING_SCHEMA}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              added
            </Text>
            <DiffFromTo diff={ADDED} previewComponent={StringPreview} schemaType={STRING_SCHEMA} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              removed
            </Text>
            <DiffFromTo
              diff={REMOVED}
              previewComponent={StringPreview}
              schemaType={STRING_SCHEMA}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              changed, inline
            </Text>
            <DiffFromTo
              diff={CHANGED}
              previewComponent={StringPreview}
              schemaType={STRING_SCHEMA}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              changed, grid (DatetimeFieldDiff / FallbackDiff)
            </Text>
            <DiffFromTo
              align="center"
              diff={CHANGED}
              layout="grid"
              previewComponent={StringPreview}
              schemaType={STRING_SCHEMA}
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
