import {type StringSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {DocumentChangeContext} from 'sanity/_singletons'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentChangeContextInstance} from '../../../../diff/contexts/DocumentChangeContext'
import {type StringDiff} from '../../../../types'
import {DatetimeFieldDiff} from '../DatetimeFieldDiff'

const DATE_SCHEMA = {
  name: 'date',
  title: 'Published on',
  jsonType: 'string',
} as StringSchemaType

const CHANGED: StringDiff = {
  type: 'string',
  action: 'changed',
  isChanged: true,
  fromValue: '2026-01-15',
  toValue: '2026-09-20',
  annotation: null,
  segments: [],
}

const ADDED: StringDiff = {
  type: 'string',
  action: 'added',
  isChanged: true,
  fromValue: undefined,
  toValue: '2026-09-20',
  annotation: null,
  segments: [],
}

const REMOVED: StringDiff = {
  type: 'string',
  action: 'removed',
  isChanged: true,
  fromValue: '2026-01-15',
  toValue: undefined,
  annotation: null,
  segments: [],
}

const DOCUMENT_CHANGE: DocumentChangeContextInstance = {
  documentId: 'doc-datetime-diff',
  schemaType: DATE_SCHEMA,
  rootDiff: null,
  isComparingCurrent: true,
  FieldWrapper: (props) => props.children,
  value: {},
  showFromValue: true,
}

/**
 * Chromatic sentinel for review-changes date diffs after the ui5 Box / Flex
 * migration: DiffFromTo grid + center align wrapping date-only previews
 * (changed / added / removed). Date-only values are timezone-safe; datetime
 * with a time is omitted because it formats in the local timezone. Standalone
 * DatetimePreview Box padding is a separate Field/Previews sentinel. Tooltips
 * stay closed (no annotations).
 */
export function DatetimeFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DocumentChangeContext.Provider value={DOCUMENT_CHANGE}>
        <Card padding={4} style={{maxWidth: 560}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                changed
              </Text>
              <DatetimeFieldDiff diff={CHANGED} schemaType={DATE_SCHEMA} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                added
              </Text>
              <DatetimeFieldDiff diff={ADDED} schemaType={DATE_SCHEMA} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                removed
              </Text>
              <DatetimeFieldDiff diff={REMOVED} schemaType={DATE_SCHEMA} />
            </VStack>
          </VStack>
        </Card>
      </DocumentChangeContext.Provider>
    </TestWrapper>
  )
}
