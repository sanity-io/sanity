import {type InvalidValueResolution} from '@portabletext/editor'
import {BookIcon} from '@sanity/icons/Book'
import {
  type AssetSource,
  type CrossDatasetReferenceSchemaType,
  defineField,
  defineType,
  type GlobalDocumentReferenceSchemaType,
  type ObjectSchemaType,
  type ReferenceSchemaType,
} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentProps} from 'react'
import {of} from 'rxjs'
import {FormBuilderContext} from 'sanity/_singletons'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {createMockAssetSourceWithMediaLibraryUploader} from '../../../../../test/fixtures/assetSourceMocks'
import {DefaultPreview} from '../../../components/previews/general/DefaultPreview'
import {useSchema} from '../../../hooks/useSchema'
import {type FormBuilderContextValue} from '../../FormBuilderContext'
import {type RenderPreviewCallback} from '../../types/renderCallback'
import {IncompatibleItemType as GridIncompatibleItemType} from '../arrays/ArrayOfObjectsInput/Grid/IncompatibleItemType'
import {OptionPreview as CrossDatasetOptionPreview} from '../CrossDatasetReferenceInput/OptionPreview'
import {PreviewReferenceValue as CrossDatasetPreviewReferenceValue} from '../CrossDatasetReferenceInput/PreviewReferenceValue'
import {type CrossDatasetReferenceInfo} from '../CrossDatasetReferenceInput/types'
import {UploadDestinationPicker} from '../files/common/UploadDestinationPicker'
import {GlobalDocumentReferenceInput} from '../GlobalDocumentReferenceInput/GlobalDocumentReferenceInput'
import {OptionPreview as GlobalDocumentOptionPreview} from '../GlobalDocumentReferenceInput/OptionPreview'
import {PreviewReferenceValue as GlobalDocumentPreviewReferenceValue} from '../GlobalDocumentReferenceInput/PreviewReferenceValue'
import {type GlobalDocumentReferenceInfo} from '../GlobalDocumentReferenceInput/types'
import {InvalidValueInput} from '../InvalidValueInput/InvalidValueInput'
import {UntypedValueInput} from '../InvalidValueInput/UntypedValueInput'
import {UnknownFields} from '../ObjectInput/UnknownFields'
import {DefaultCustomMarkers} from '../PortableText/_legacyDefaultParts/CustomMarkers'
import {DefaultMarkers} from '../PortableText/_legacyDefaultParts/Markers'
import {InvalidValue} from '../PortableText/InvalidValue'
import {OptionPreview} from '../ReferenceInput/OptionPreview'
import {ReferenceFinalizeAlertStrip} from '../ReferenceInput/ReferenceFinalizeAlertStrip'
import {ReferenceMetadataLoadErrorAlertStrip} from '../ReferenceInput/ReferenceMetadataLoadFailure'
import {ReferenceStrengthMismatchAlertStrip} from '../ReferenceInput/ReferenceStrengthMismatchAlertStrip'

const READABLE = {available: true, reason: 'READABLE'} as const

const ARTICLE_SCHEMA = [
  defineType({
    type: 'document',
    name: 'article',
    title: 'Article',
    fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
  }),
]

const BOOK_TARGET = {
  type: 'book',
  title: 'Book',
  icon: BookIcon,
  preview: {select: {title: 'title'}},
}

const REFERENCE_SCHEMA = [
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

const BOOK_REFERENCE_INFO = {
  id: 'book-1',
  type: 'book',
  availability: READABLE,
  preview: {
    published: {title: 'The Left Hand of Darkness', subtitle: 'Ursula K. Le Guin'},
  },
}
const SEARCH_RESULT_REFERENCE_INFO = {
  ...BOOK_REFERENCE_INFO,
  preview: {published: {title: 'Search result fixture'}},
}

function getCrossDatasetReferenceInfo() {
  return of(SEARCH_RESULT_REFERENCE_INFO satisfies CrossDatasetReferenceInfo)
}

function getGlobalDocumentReferenceInfo() {
  return of(SEARCH_RESULT_REFERENCE_INFO satisfies GlobalDocumentReferenceInfo)
}

function emptySearch() {
  return of([])
}

const renderPreview: RenderPreviewCallback = () => <DefaultPreview title="Untitled author" />

const MARKERS_FORM_BUILDER = {
  __internal: {
    components: {
      CustomMarkers: DefaultCustomMarkers,
      Markers: DefaultMarkers,
    },
  },
} as unknown as FormBuilderContextValue

const INVALID_VALUE_RESOLUTION = {
  action: 'resolve',
  description: 'Block is missing a required key',
  i18n: {
    action: 'inputs.portable-text.invalid-value.missing-key.action',
    description: 'inputs.portable-text.invalid-value.missing-key.description',
    values: {},
  },
  item: {_type: 'block', children: [{_type: 'span', text: 'Missing keys'}]},
  patches: [],
} as unknown as InvalidValueResolution

const ASSET_SOURCES: AssetSource[] = [
  createMockAssetSourceWithMediaLibraryUploader({name: 'images', title: 'Image library'}),
  createMockAssetSourceWithMediaLibraryUploader({
    name: 'archive',
    title: 'Company archive',
    uploadMode: 'component',
  }),
]

const LOADED_REFERENCE_INFO = {
  isLoading: false as const,
  result: BOOK_REFERENCE_INFO,
  error: undefined,
  retry: noop,
}

function ValueWarningsHarness() {
  return (
    <TestWrapper schemaTypes={ARTICLE_SCHEMA}>
      <Card padding={4} style={{maxWidth: 560}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              invalid primitive value
            </Text>
            <InvalidValueInput
              actualType="number"
              onChange={noop}
              validTypes={['string']}
              value={42}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              object without a type
            </Text>
            <UntypedValueInput
              onChange={noop}
              validTypes={['article']}
              value={{title: 'Untyped article'}}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              unknown object fields
            </Text>
            <UnknownFields
              fieldNames={['legacyTitle', 'legacyAuthor']}
              onChange={noop}
              renderPreview={renderPreview}
              value={{
                legacyTitle: 'Old title',
                legacyAuthor: {_type: 'reference', _ref: 'author-1'},
              }}
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}

function PortableTextWarningsHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <FormBuilderContext.Provider value={MARKERS_FORM_BUILDER}>
        <Card padding={4} style={{maxWidth: 560}}>
          <Stack gap={5}>
            <InvalidValue onChange={noop} onIgnore={noop} resolution={INVALID_VALUE_RESOLUTION} />
            <DefaultMarkers
              markers={[]}
              validation={[
                {level: 'error', message: 'Alternative text is required', path: []},
                {level: 'warning', message: 'Keep the excerpt concise', path: []},
                {level: 'info', message: 'Formatting guidance', path: []},
              ]}
            />
          </Stack>
        </Card>
      </FormBuilderContext.Provider>
    </TestWrapper>
  )
}

function GridIncompatibleItemHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <div style={{maxWidth: 180}}>
        <GridIncompatibleItemType value={{_type: 'legacyMarketingHero', title: 'Legacy hero'}} />
      </div>
    </TestWrapper>
  )
}

function UploadDestinationHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <UploadDestinationPicker
        assetSources={ASSET_SOURCES}
        onClose={noop}
        onSelectAssetSource={noop}
        text="Choose an upload destination"
      />
    </TestWrapper>
  )
}

function ReferenceChromeFields() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const referenceType = documentType.fields[0].type as ReferenceSchemaType
  const crossDatasetType = documentType.fields[1].type as CrossDatasetReferenceSchemaType
  const globalDocumentType = documentType.fields[2].type as GlobalDocumentReferenceSchemaType

  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <Stack gap={5}>
        <OptionPreview
          id="author-1"
          referenceType={referenceType}
          renderPreview={renderPreview}
          type="author"
        />
        <CrossDatasetOptionPreview
          document={{_id: 'book-1', _type: 'book'}}
          getReferenceInfo={getCrossDatasetReferenceInfo}
          referenceType={crossDatasetType}
        />
        <CrossDatasetPreviewReferenceValue
          referenceInfo={LOADED_REFERENCE_INFO}
          type={crossDatasetType}
          value={{
            _type: 'crossDatasetReference',
            _ref: 'book-1',
            _dataset: 'library',
            _projectId: 'abc123',
          }}
        />
        <GlobalDocumentOptionPreview
          document={{_id: 'book-1', _type: 'book'}}
          getReferenceInfo={getGlobalDocumentReferenceInfo}
          referenceType={globalDocumentType}
        />
        <GlobalDocumentPreviewReferenceValue
          referenceInfo={LOADED_REFERENCE_INFO}
          type={globalDocumentType}
          value={{
            _type: 'globalDocumentReference',
            _ref: 'dataset:abc123.library:book-1',
          }}
        />
        <ReferenceFinalizeAlertStrip
          handleRemoveStrengthenOnPublish={noop}
          schemaType={referenceType}
        />
        <ReferenceStrengthMismatchAlertStrip
          actualStrength="weak"
          handleFixStrengthMismatch={noop}
        />
        <ReferenceMetadataLoadErrorAlertStrip
          errorMessage="The reference metadata could not be loaded."
          onHandleRetry={noop}
        />
        <GlobalDocumentReferenceInput
          {...({
            changed: false,
            elementProps: {id: 'global-document-reference', onBlur: noop, onFocus: noop, ref: null},
            focusPath: [],
            focused: false,
            getReferenceInfo: getGlobalDocumentReferenceInfo,
            id: 'global-document-reference',
            level: 0,
            onChange: noop,
            onPathBlur: noop,
            onPathFocus: noop,
            onSearch: emptySearch,
            path: [],
            presence: [],
            readOnly: false,
            schemaType: globalDocumentType,
            validation: [],
            value: undefined,
          } as unknown as ComponentProps<typeof GlobalDocumentReferenceInput>)}
        />
      </Stack>
    </Card>
  )
}

function ReferenceChromeHarness() {
  return (
    <TestWrapper schemaTypes={REFERENCE_SCHEMA}>
      <ReferenceChromeFields />
    </TestWrapper>
  )
}

describe('form input chrome', () => {
  test('renders invalid, untyped, and unknown value warnings', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ValueWarningsHarness />)

    await expect.element(page.getByText('Invalid property value')).toBeVisible()
    await expect.element(page.getByText('Convert to article')).toBeVisible()
    await expect.element(page.getByText('Unknown fields found')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders portable text invalid values and validation markers', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<PortableTextWarningsHarness />)

    await expect.element(page.getByText('Invalid Portable Text value')).toBeVisible()
    await expect.element(page.getByText('Alternative text is required')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders an incompatible grid item', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<GridIncompatibleItemHarness />)

    await expect.element(page.getByRole('button', {name: /legacyMarketingHero/})).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the upload destination picker', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UploadDestinationHarness />)

    await expect.element(page.getByText('Choose an upload destination')).toBeVisible()
    await expect.element(page.getByText('Image library')).toBeVisible()
    await expect.element(page.getByText('Company archive')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders reference option previews, alerts, and an empty global document reference', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReferenceChromeHarness />)

    await expect.element(page.getByText('Untitled author')).toBeVisible()
    await expect.element(page.getByText('Search result fixture').nth(1)).toBeVisible()
    await expect.element(page.getByText('The Left Hand of Darkness').first()).toBeVisible()
    await expect
      .element(
        page
          .getByTestId('alert-reference-published')
          .getByRole('button', {name: 'Convert to strong reference'}),
      )
      .toBeVisible()
    await expect.element(page.getByTestId('alert-reference-strength-mismatch')).toBeVisible()
    await expect.element(page.getByTestId('alert-reference-info-failed')).toBeVisible()
    await expect.element(page.getByTestId('autocomplete')).toBeVisible()
    await settleChromaticEndState()
  })
})
