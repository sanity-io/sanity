import {type NumberSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {DocumentChangeContext} from 'sanity/_singletons'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentChangeContextInstance} from '../../../../diff/contexts/DocumentChangeContext'
import {type NumberDiff} from '../../../../types'
import {NumberFieldDiff} from '../NumberFieldDiff'

const NUMBER_SCHEMA = {
  name: 'count',
  title: 'Count',
  jsonType: 'number',
} as NumberSchemaType

const CHANGED: NumberDiff = {
  type: 'number',
  action: 'changed',
  isChanged: true,
  fromValue: 1,
  toValue: 99,
  annotation: null,
}

const ADDED: NumberDiff = {
  type: 'number',
  action: 'added',
  isChanged: true,
  fromValue: undefined,
  toValue: 7,
  annotation: null,
}

const REMOVED: NumberDiff = {
  type: 'number',
  action: 'removed',
  isChanged: true,
  fromValue: 3,
  toValue: undefined,
  annotation: null,
}

const DOCUMENT_CHANGE: DocumentChangeContextInstance = {
  documentId: 'doc-number-diff',
  schemaType: NUMBER_SCHEMA,
  rootDiff: null,
  isComparingCurrent: true,
  FieldWrapper: (props) => props.children,
  value: {},
  showFromValue: true,
}

/**
 * Chromatic sentinel for review-changes number diffs after the ui5 Box
 * migration: changed / added / removed DiffFromTo layouts. Standalone
 * NumberPreview chrome is covered by Field/Previews. Tooltips stay closed
 * (no annotations).
 */
export function NumberFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DocumentChangeContext.Provider value={DOCUMENT_CHANGE}>
        <Card padding={4} style={{maxWidth: 420}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                changed
              </Text>
              <NumberFieldDiff diff={CHANGED} schemaType={NUMBER_SCHEMA} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                added
              </Text>
              <NumberFieldDiff diff={ADDED} schemaType={NUMBER_SCHEMA} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                removed
              </Text>
              <NumberFieldDiff diff={REMOVED} schemaType={NUMBER_SCHEMA} />
            </VStack>
          </VStack>
        </Card>
      </DocumentChangeContext.Provider>
    </TestWrapper>
  )
}
