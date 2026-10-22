import {type Image, type ObjectSchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {DocumentChangeContext} from 'sanity/_singletons'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentChangeContextInstance} from '../../../../diff/contexts/DocumentChangeContext'
import {type ObjectDiff} from '../../../../types'
import {ImageFieldDiff} from '../ImageFieldDiff'
import {NoImagePreview} from '../ImagePreview'

const IMAGE_SCHEMA = {
  name: 'image',
  title: 'Image',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

const EMPTY_CHANGED = {
  type: 'object',
  action: 'changed',
  isChanged: true,
  fromValue: {_type: 'image'},
  toValue: {_type: 'image'},
  fields: {},
  annotation: null,
} as unknown as ObjectDiff<Image>

const DOCUMENT_CHANGE: DocumentChangeContextInstance = {
  documentId: 'doc-image-diff',
  schemaType: IMAGE_SCHEMA,
  rootDiff: null,
  isComparingCurrent: true,
  FieldWrapper: (props) => props.children,
  value: {},
  showFromValue: true,
}

/**
 * Chromatic sentinel for review-changes image diffs after the ui5 Box / Flex
 * migration. The empty placeholder and the from/to pair of NoImagePreview
 * cards pin transparent Card tone against centered muted copy — a mix
 * TypeScript will not catch. No live image assets or timestamps.
 */
export function ImageFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DocumentChangeContext.Provider value={DOCUMENT_CHANGE}>
        <Card padding={4} style={{maxWidth: 480}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                no image preview
              </Text>
              <div style={{height: 140}}>
                <NoImagePreview />
              </div>
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                empty from / to
              </Text>
              <ImageFieldDiff diff={EMPTY_CHANGED} schemaType={IMAGE_SCHEMA} />
            </VStack>
          </VStack>
        </Card>
      </DocumentChangeContext.Provider>
    </TestWrapper>
  )
}
