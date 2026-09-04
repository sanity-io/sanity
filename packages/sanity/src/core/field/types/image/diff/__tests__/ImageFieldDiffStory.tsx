import {type Image, type ObjectSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {DocumentChangeContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentChangeContextInstance} from '../../../../diff/contexts/DocumentChangeContext'
import {type ObjectDiff} from '../../../../types'
import {ImageFieldDiff} from '../ImageFieldDiff'
import {NoImagePreview} from '../ImagePreview'

const IMAGE_SCHEMA = {
  name: 'hero',
  title: 'Hero image',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

const ASSET_CHANGED = {
  type: 'object',
  action: 'changed',
  isChanged: true,
  fromValue: undefined,
  toValue: undefined,
  annotation: null,
  fields: {
    asset: {
      type: 'object',
      action: 'changed',
      isChanged: true,
      fromValue: undefined,
      toValue: undefined,
      annotation: null,
      fields: {},
    },
  },
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
 * Chromatic sentinel for review-changes image diffs after the ui5 Box/Flex
 * migration: the empty-image placeholder and the from/to grid when an
 * asset change has no resolved refs. Live image URLs are omitted so the
 * snapshot stays offline and deterministic.
 */
export function ImageFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DocumentChangeContext.Provider value={DOCUMENT_CHANGE}>
        <Card padding={4} style={{maxWidth: 520}}>
          <Stack gap={5}>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                no image placeholder
              </Text>
              <NoImagePreview />
            </Stack>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                asset changed, no refs
              </Text>
              <ImageFieldDiff diff={ASSET_CHANGED} schemaType={IMAGE_SCHEMA} />
            </Stack>
          </Stack>
        </Card>
      </DocumentChangeContext.Provider>
    </TestWrapper>
  )
}
