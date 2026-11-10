import {
  defineField,
  defineType,
  type ImageAsset,
  type ImageValue,
  type SanityDocument,
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
import {BaseImageInput, type BaseImageInputProps} from '../ImageInput'
import {ImageInputHotspotInput} from '../ImageInputHotspotInput'

const IMAGE_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const IMAGE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-100x100-jpg'
const IMAGE_VALUE = {
  _type: 'image',
  asset: {_type: 'reference', _ref: IMAGE_REF},
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
  _id: IMAGE_REF,
  _type: 'sanity.imageAsset',
  _rev: 'image-asset-rev',
  assetId: 'a75b03fdd5b5fa36947bf2b776a542e0c940f682',
  extension: 'jpg',
  mimeType: 'image/jpeg',
  originalFilename: 'fixture.jpg',
  path: 'images/test/test/a75b03fdd5b5fa36947bf2b776a542e0c940f682-100x100.jpg',
  size: 43,
  url: IMAGE_URL,
  metadata: {
    _type: 'sanity.imageMetadata',
    dimensions: {_type: 'sanity.imageDimensions', aspectRatio: 1, height: 100, width: 100},
  },
} as ImageAsset
const IMAGE_URL_BUILDER = {
  auto() {
    return this
  },
  dpr() {
    return this
  },
  fit() {
    return this
  },
  forceDownload() {
    return this
  },
  image() {
    return this
  },
  url() {
    return IMAGE_URL
  },
  width() {
    return this
  },
} as unknown as BaseImageInputProps['imageUrlBuilder']

function observeAsset() {
  return of(IMAGE_ASSET)
}

async function waitForFixtureImage() {
  await expect
    .poll(() =>
      Array.from(document.images).some(
        (image) => image.src === IMAGE_URL && image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true)
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

function BaseImageSchemaInput(props: SchemaImageInputProps) {
  const baseProps = useBaseImageInputProps(props as ImageInputProps)
  return <BaseImageInput {...baseProps} />
}

function HotspotSchemaInput(props: SchemaImageInputProps) {
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
        components: {input: BaseImageSchemaInput},
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
        components: {input: HotspotSchemaInput},
      }),
    ],
  }),
]

function ImageInputHarness() {
  return (
    <TestWrapper schemaTypes={BASE_IMAGE_SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

function ImageInputHotspotInputHarness() {
  return (
    <TestWrapper schemaTypes={HOTSPOT_SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

describe('image input', () => {
  test('renders an image input with a fixture asset', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageInputHarness />)

    await waitForFixtureImage()
    await expect.element(page.getByText('Image', {exact: true})).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the hotspot editor dialog', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageInputHotspotInputHarness />)

    await waitForFixtureImage()
    await expect.element(page.getByText('Edit hotspot and crop')).toBeVisible()
    await settleChromaticEndState()
  })
})
