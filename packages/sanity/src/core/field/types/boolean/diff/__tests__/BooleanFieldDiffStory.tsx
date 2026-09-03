import {type BooleanSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {DocumentChangeContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentChangeContextInstance} from '../../../../diff/contexts/DocumentChangeContext'
import {type BooleanDiff} from '../../../../types'
import {BooleanFieldDiff} from '../BooleanFieldDiff'

const SWITCH_SCHEMA = {
  name: 'featured',
  title: 'Featured',
  jsonType: 'boolean',
} as BooleanSchemaType

const CHECKBOX_SCHEMA = {
  name: 'approved',
  title: 'Approved',
  jsonType: 'boolean',
  options: {layout: 'checkbox'},
} as BooleanSchemaType

const CHANGED: BooleanDiff = {
  type: 'boolean',
  action: 'changed',
  isChanged: true,
  fromValue: false,
  toValue: true,
  annotation: null,
}

const ADDED: BooleanDiff = {
  type: 'boolean',
  action: 'added',
  isChanged: true,
  fromValue: undefined,
  toValue: true,
  annotation: null,
}

const DOCUMENT_CHANGE: DocumentChangeContextInstance = {
  documentId: 'doc-boolean-diff',
  schemaType: SWITCH_SCHEMA,
  rootDiff: null,
  isComparingCurrent: true,
  FieldWrapper: (props) => props.children,
  value: {},
  showFromValue: true,
}

/**
 * Chromatic sentinel for review-changes boolean diffs: Box spacing around
 * the from/to arrow and field title, plus switch vs checkbox layouts.
 * Tooltips stay closed (no annotations). Grid harness for the co-located
 * Storybook CSF file.
 */
export function BooleanFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DocumentChangeContext.Provider value={DOCUMENT_CHANGE}>
        <Card padding={4} style={{maxWidth: 420}}>
          <Stack gap={5}>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                switch changed
              </Text>
              <BooleanFieldDiff diff={CHANGED} schemaType={SWITCH_SCHEMA} />
            </Stack>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                checkbox changed
              </Text>
              <BooleanFieldDiff diff={CHANGED} schemaType={CHECKBOX_SCHEMA} />
            </Stack>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                switch added
              </Text>
              <BooleanFieldDiff diff={ADDED} schemaType={SWITCH_SCHEMA} />
            </Stack>
          </Stack>
        </Card>
      </DocumentChangeContext.Provider>
    </TestWrapper>
  )
}
