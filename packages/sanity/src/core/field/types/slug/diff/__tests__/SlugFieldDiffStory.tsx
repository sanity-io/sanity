import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {DocumentChangeContext} from 'sanity/_singletons'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentChangeContextInstance} from '../../../../diff/contexts/DocumentChangeContext'
import {type ObjectDiff} from '../../../../types'
import {SlugFieldDiff} from '../SlugFieldDiff'

interface SlugValue {
  current?: string
}

const SLUG_SCHEMA = {
  name: 'slug',
  title: 'Slug',
  jsonType: 'object',
} as ObjectSchemaType

const CURRENT_CHANGED: ObjectDiff<SlugValue>['fields']['current'] = {
  type: 'string',
  action: 'changed',
  isChanged: true,
  fromValue: 'old-slug',
  toValue: 'new-slug',
  annotation: null,
  segments: [],
}

const CURRENT_ADDED: ObjectDiff<SlugValue>['fields']['current'] = {
  type: 'string',
  action: 'added',
  isChanged: true,
  fromValue: undefined,
  toValue: 'hello-world',
  annotation: null,
  segments: [],
}

const CHANGED: ObjectDiff<SlugValue> = {
  type: 'object',
  action: 'changed',
  isChanged: true,
  fromValue: {current: 'old-slug'},
  toValue: {current: 'new-slug'},
  annotation: null,
  fields: {current: CURRENT_CHANGED},
}

const ADDED: ObjectDiff<SlugValue> = {
  type: 'object',
  action: 'added',
  isChanged: true,
  fromValue: undefined,
  toValue: {current: 'hello-world'},
  annotation: null,
  fields: {current: CURRENT_ADDED},
}

const DOCUMENT_CHANGE: DocumentChangeContextInstance = {
  documentId: 'doc-slug-diff',
  schemaType: SLUG_SCHEMA,
  rootDiff: null,
  isComparingCurrent: true,
  FieldWrapper: (props) => props.children,
  value: {},
  showFromValue: true,
}

/**
 * Chromatic sentinel for review-changes slug diffs after the ui5 Box
 * migration: changed / added DiffFromTo layouts. Standalone SlugPreview
 * chrome is covered by Field/Previews. Tooltips stay closed (no annotations).
 */
export function SlugFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DocumentChangeContext.Provider value={DOCUMENT_CHANGE}>
        <Card padding={4} style={{maxWidth: 420}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                changed
              </Text>
              <SlugFieldDiff diff={CHANGED} schemaType={SLUG_SCHEMA} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                added
              </Text>
              <SlugFieldDiff diff={ADDED} schemaType={SLUG_SCHEMA} />
            </VStack>
          </VStack>
        </Card>
      </DocumentChangeContext.Provider>
    </TestWrapper>
  )
}
