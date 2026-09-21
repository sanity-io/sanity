import {
  defineField,
  defineType,
  type ImageAsset,
  type ImageValue,
  type ObjectSchemaType,
  type SanityDocument,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {of} from 'rxjs'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {useClient} from '../../../../../hooks/useClient'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {type ImageInputProps} from '../../../../studio/inputs/StudioImageInput'
import {type ObjectInputProps} from '../../../../types/inputProps'
import {BaseImageInput, type BaseImageInputProps} from '../../ImageInput/ImageInput'
import {ImageInputHotspotInput} from '../../ImageInput/ImageInputHotspotInput'
import {ImageToolInput} from '../../ImageToolInput/ImageToolInput'

const IMAGE_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const IMAGE_VALUE = {
  _type: 'image',
  asset: {_type: 'reference', _ref: 'image-fixture-100x100-gif'},
}
const DOCUMENT: SanityDocument = {
  _id: 'image-input-visual',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'image-input-visual-rev',
  image: IMAGE_VALUE,
}
const IMAGE_ASSET = {
  _id: 'image-fixture-100x100-gif',
  _type: 'sanity.imageAsset',
  _rev: 'image-asset-rev',
  assetId: 'fixture',
  extension: 'gif',
  mimeType: 'image/gif',
  originalFilename: 'fixture.gif',
  path: 'images/test/test/fixture-100x100.gif',
  size: 43,
  url: IMAGE_URL,
  metadata: {
    _type: 'sanity.imageMetadata',
    dimensions: {_type: 'sanity.imageDimensions', aspectRatio: 1, height: 100, width: 100},
  },
} as ImageAsset
const IMAGE_URL_BUILDER = {
  image: () => ({url: () => IMAGE_URL}),
} as unknown as BaseImageInputProps['imageUrlBuilder']

function observeAsset() {
  return of(IMAGE_ASSET)
}

function useBaseImageInputProps(props: ImageInputProps): BaseImageInputProps {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {t} = useTranslation()

  return {
    ...props,
    assetSources: [],
    client,
    directUploads: false,
    imageUrlBuilder: IMAGE_URL_BUILDER,
    isUploading: false,
    observeAsset,
    resolveUploader: () => null,
    t,
  }
}

type SchemaImageInputProps = ObjectInputProps<ImageValue>

function BaseImageVisualInput(props: SchemaImageInputProps) {
  const baseProps = useBaseImageInputProps(props as ImageInputProps)
  return <BaseImageInput {...baseProps} />
}

function HotspotVisualInput(props: SchemaImageInputProps) {
  const imageInputProps = props as ImageInputProps
  const baseProps = useBaseImageInputProps(imageInputProps)
  return (
    <ImageInputHotspotInput
      handleCloseDialog={() => undefined}
      imageInputProps={baseProps}
      inputProps={imageInputProps}
      isImageToolEnabled
    />
  )
}

function ImageToolVisualInput(props: SchemaImageInputProps) {
  return <ImageToolInput {...(props as ImageInputProps)} imageUrl={IMAGE_URL} />
}

const BASE_IMAGE_SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'image',
        name: 'image',
        title: 'Image',
        options: {hotspot: true},
        components: {input: BaseImageVisualInput},
      }),
    ],
  }),
]

const HOTSPOT_SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'image',
        name: 'image',
        title: 'Image',
        options: {hotspot: true},
        components: {input: HotspotVisualInput},
      }),
    ],
  }),
]

const IMAGE_TOOL_SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'image',
        name: 'image',
        title: 'Image',
        options: {hotspot: true},
        components: {input: ImageToolVisualInput},
      }),
    ],
  }),
]

function ImageInputHarness({schemaTypes}: {schemaTypes: SchemaTypeDefinition[]}) {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('image input visual coverage', () => {
  test('renders an image input with a fixture asset', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageInputHarness schemaTypes={BASE_IMAGE_SCHEMA} />)

    await expect.element(page.getByText('fixture.gif')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the hotspot editor dialog', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageInputHarness schemaTypes={HOTSPOT_SCHEMA} />)

    await expect.element(page.getByText('Edit hotspot and crop')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the image tool', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageInputHarness schemaTypes={IMAGE_TOOL_SCHEMA} />)

    await expect.element(page.getByText('Hotspot and crop')).toBeVisible()
    await settleChromaticEndState()
  })
})
