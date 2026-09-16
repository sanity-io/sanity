import {BookIcon} from '@sanity/icons/Book'
import {
  type CrossDatasetReferenceSchemaType,
  defineField,
  defineType,
  type GlobalDocumentReferenceSchemaType,
  type ObjectSchemaType,
  type Reference,
  type ReferenceSchemaType,
} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DefaultPreview} from '../../../../components/previews/general/DefaultPreview'
import {useSchema} from '../../../../hooks/useSchema'
import {type RenderPreviewCallback} from '../../../types/renderCallback'
import {CrossDatasetReferencePreview} from '../../CrossDatasetReferenceInput/CrossDatasetReferencePreview'
import {DisabledFeatureWarning} from '../../CrossDatasetReferenceInput/DisabledFeatureWarning'
import {GlobalDocumentReferencePreview} from '../../GlobalDocumentReferenceInput/GlobalDocumentReferencePreview'
import {PreviewReferenceValue} from '../PreviewReferenceValue'
import {type ReferenceInfo} from '../types'
import {type Loadable} from '../useReferenceInfo'

const BOOK_TARGET = {
  type: 'book',
  title: 'Book',
  icon: BookIcon,
  preview: {select: {title: 'title'}},
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'author',
    title: 'Author',
    fields: [defineField({type: 'string', name: 'name', title: 'Name'})],
  }),
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'reference', name: 'author', title: 'Author', to: [{type: 'author'}]}),
      defineField({
        type: 'crossDatasetReference',
        name: 'book',
        title: 'Book',
        dataset: 'library',
        to: [BOOK_TARGET],
      }),
      defineField({
        type: 'globalDocumentReference',
        name: 'globalBook',
        title: 'Global book',
        resourceType: 'dataset',
        resourceId: 'abc123.library',
        to: [BOOK_TARGET],
      }),
    ],
  }),
]

const NOT_FOUND = {available: false, reason: 'NOT_FOUND'} as const
const PERMISSION_DENIED = {available: false, reason: 'PERMISSION_DENIED'} as const
const READABLE = {available: true, reason: 'READABLE'} as const

const REFERENCE: Reference = {_ref: 'author-1', _type: 'reference'}
const IN_PLACE_REFERENCE: Reference = {
  ...REFERENCE,
  _weak: true,
  _strengthenOnPublish: {type: 'author', template: {id: 'author', params: {}}},
}

const BOOK_PREVIEW = {
  published: {title: 'The Left Hand of Darkness', subtitle: 'Ursula K. Le Guin'},
}

function referenceInfo(overrides: Partial<ReferenceInfo>): Loadable<ReferenceInfo> {
  return {
    isLoading: false,
    error: undefined,
    retry: noop,
    result: {
      id: REFERENCE._ref,
      type: 'author',
      isPublished: true,
      availability: READABLE,
      preview: {snapshot: null, original: null},
      ...overrides,
    },
  }
}

const renderPreview: RenderPreviewCallback = (props) => (
  <DefaultPreview
    media={props.schemaType.icon ? <props.schemaType.icon /> : undefined}
    title="Untitled author"
  />
)

function Labelled({label, children}: {label: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      {children}
    </Stack>
  )
}

function Row({children}: {children: ReactNode}) {
  return (
    <Card border padding={1} radius={2}>
      {children}
    </Card>
  )
}

function ReferenceChrome() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const referenceType = documentType.fields[0].type as ReferenceSchemaType
  const crossDatasetType = documentType.fields[1].type as CrossDatasetReferenceSchemaType
  const globalDocumentType = documentType.fields[2].type as GlobalDocumentReferenceSchemaType

  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <Stack gap={5}>
        <Labelled label="reference value (not found, no permission, invalid type, created in place)">
          <Row>
            <PreviewReferenceValue
              referenceInfo={referenceInfo({type: undefined, availability: NOT_FOUND})}
              renderPreview={renderPreview}
              type={referenceType}
              value={REFERENCE}
            />
          </Row>
          <Row>
            <PreviewReferenceValue
              referenceInfo={referenceInfo({type: undefined, availability: PERMISSION_DENIED})}
              renderPreview={renderPreview}
              type={referenceType}
              value={REFERENCE}
            />
          </Row>
          <Row>
            <PreviewReferenceValue
              referenceInfo={referenceInfo({type: 'category'})}
              renderPreview={renderPreview}
              type={referenceType}
              value={REFERENCE}
            />
          </Row>
          <Row>
            <PreviewReferenceValue
              referenceInfo={referenceInfo({type: undefined, availability: NOT_FOUND})}
              renderPreview={renderPreview}
              showTypeLabel
              type={referenceType}
              value={IN_PLACE_REFERENCE}
            />
          </Row>
        </Labelled>

        <Labelled label="cross dataset reference (available, not found, no permission)">
          <Row>
            <CrossDatasetReferencePreview
              availability={READABLE}
              dataset="library"
              hasStudioUrl
              id="book-1"
              preview={BOOK_PREVIEW}
              projectId="abc123"
              refType={crossDatasetType.to[0]}
              showStudioUrlIcon
              showTypeLabel
            />
          </Row>
          <Row>
            <CrossDatasetReferencePreview
              availability={NOT_FOUND}
              dataset="library"
              id="book-1"
              preview={{published: undefined}}
              projectId="abc123"
              refType={crossDatasetType.to[0]}
              showTypeLabel
            />
          </Row>
          <Row>
            <CrossDatasetReferencePreview
              availability={PERMISSION_DENIED}
              dataset="library"
              id="book-1"
              preview={{published: undefined}}
              projectId="abc123"
              refType={crossDatasetType.to[0]}
              showTypeLabel={false}
            />
          </Row>
        </Labelled>

        <Labelled label="global document reference (available)">
          <Row>
            <GlobalDocumentReferencePreview
              availability={READABLE}
              hasStudioUrl={false}
              id="book-1"
              preview={BOOK_PREVIEW}
              refType={globalDocumentType.to[0]}
              resourceId="abc123.library"
              resourceType="dataset"
              showStudioUrlIcon
              showTypeLabel
            />
          </Row>
        </Labelled>

        <Labelled label="cross dataset feature disabled (empty, with value)">
          <DisabledFeatureWarning />
          <DisabledFeatureWarning
            onClearValue={noop}
            value={{
              _type: 'crossDatasetReference',
              _ref: 'book-1',
              _dataset: 'library',
              _projectId: 'abc123',
            }}
          />
        </Labelled>
      </Stack>
    </Card>
  )
}

/**
 * Chromatic sentinel for the reference preview chrome after the ui5 Flex
 * migration: the unavailable, invalid-type and created-in-place states of
 * `PreviewReferenceValue`, the cross-dataset and global document previews
 * whose zero-basis growing Flex hosts the preview next to the type badge and
 * status icons, and the caution card shown when cross-dataset references are
 * disabled. Reference and availability data are fixtures (no preview store);
 * tooltips and menus stay closed.
 */
export function ReferenceChromeStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <ReferenceChrome />
    </TestWrapper>
  )
}
