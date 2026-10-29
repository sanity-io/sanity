import {
  defineField,
  defineType,
  type ImageSchemaType,
  type ImageValue,
  type SanityDocument,
} from '@sanity/types'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type ImageInputProps} from '../../../../studio/inputs/StudioImageInput'
import {type ObjectInputProps} from '../../../../types/inputProps'
import {ImageToolInput} from '../ImageToolInput'

const IMAGE_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const IMAGE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-100x100-jpg'
const WIDE_IMAGE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-2000x1000-jpg'
const DOCUMENT: SanityDocument = {
  _id: 'image-tool-input',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'image-tool-input-rev',
  image: {
    _type: 'image',
    asset: {_type: 'reference', _ref: IMAGE_REF},
  },
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

type SchemaImageInputProps = ObjectInputProps<ImageValue>
type ImageValueOptions = NonNullable<ImageSchemaType['options']>

function ImageToolSchemaInput(props: SchemaImageInputProps) {
  return <ImageToolInput {...(props as ImageInputProps)} imageUrl={IMAGE_URL} />
}

function createImageSchema(options: ImageValueOptions) {
  return [
    defineType({
      type: 'document',
      name: 'test',
      title: 'Test',
      fields: [
        defineField({
          type: 'image',
          name: 'image',
          title: 'Image',
          options,
          components: {input: ImageToolSchemaInput},
        }),
      ],
    }),
  ]
}

const SCHEMA = createImageSchema({hotspot: true})

function ImageToolInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}

const CROP_ONLY_DOCUMENT: SanityDocument = {
  ...DOCUMENT,
  image: {
    _type: 'image',
    asset: {_type: 'reference', _ref: WIDE_IMAGE_REF},
  },
}

const CROP_FOCUS_PATH = ['image', 'crop']

const CROP_ONLY_SCHEMA = createImageSchema({
  aspectRatio: 1,
  minDimensions: {width: 600, height: 600},
})

function CropOnlyImageToolInputHarness() {
  return (
    <TestWrapper schemaTypes={CROP_ONLY_SCHEMA}>
      {/* Focused like the image input's crop dialog, so focusing the crop does not move focus */}
      <TestForm document={CROP_ONLY_DOCUMENT} focusPath={CROP_FOCUS_PATH} />
    </TestWrapper>
  )
}

function WideImageToolInputHarness({options}: {options: ImageValueOptions}) {
  return (
    <TestWrapper schemaTypes={createImageSchema(options)}>
      <TestForm document={CROP_ONLY_DOCUMENT} />
    </TestWrapper>
  )
}

function getCropSize() {
  return page.getByTestId('image-tool-crop-size')
}

describe('image tool input', () => {
  test('renders the hotspot and crop tool', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageToolInputHarness />)

    await waitForFixtureImage()
    await expect.element(page.getByText('Hotspot & Crop')).toBeVisible()
    await settleChromaticEndState()
  })

  test('edits the crop alone, held to its aspect ratio, when the field has no hotspot', async () => {
    const {findBySelector, getModifierKey, settleChromaticEndState, waitForDocumentState} =
      testHelpers()
    void render(<CropOnlyImageToolInputHarness />)

    await waitForFixtureImage()
    await expect.element(page.getByText('Crop', {exact: true})).toBeVisible()
    const cropRect = await findBySelector(
      {element: () => document.body},
      'rect[data-handle="crop"][tabindex]',
    )
    expect(document.querySelector('[data-handle="hotspot"]')).toBeNull()

    await expect.element(getCropSize()).toHaveTextContent('2000 × 1000 px')
    ;(cropRect.element() as SVGRectElement).focus()
    const modifier = getModifierKey()
    await userEvent.keyboard(`{${modifier}>}{ArrowLeft}{/${modifier}}`)

    const state = await waitForDocumentState((documentState) => Boolean(documentState?.image?.crop))
    // One step on the right edge of a 2000 × 1000 image fits the 1:1 ratio to the full height.
    expect(state.image.crop.right).toBeCloseTo(0.5)
    expect(state.image.crop.left).toBeCloseTo(0)
    expect(state.image.crop.top).toBeCloseTo(0)
    expect(state.image.crop.bottom).toBeCloseTo(0)
    expect(state.image.hotspot).toBeUndefined()
    await expect.element(getCropSize()).toHaveTextContent('1000 × 1000 px')
    await expect.element(getCropSize()).toHaveAttribute('data-tone', 'default')
    await settleChromaticEndState()
  })

  test('shows no crop size without a size or ratio option', async () => {
    void render(<ImageToolInputHarness />)

    await waitForFixtureImage()
    await expect.element(page.getByText('Hotspot & Crop')).toBeVisible()
    expect(document.querySelector('[data-testid="image-tool-crop-size"]')).toBeNull()
  })

  test('flags a crop below the recommended size', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <WideImageToolInputHarness
        options={{hotspot: true, recommendedDimensions: {width: 2400, height: 1200}}}
      />,
    )

    await waitForFixtureImage()
    await expect.element(getCropSize()).toHaveAttribute('data-tone', 'caution')
    await expect
      .element(getCropSize())
      .toHaveTextContent('2000 × 1000 pxSmaller than the recommended 2400 × 1200 px')
    await settleChromaticEndState()
  })

  test('flags a crop below the minimum size over the recommended size', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <WideImageToolInputHarness
        options={{
          hotspot: true,
          minDimensions: {width: 2400, height: 600},
          recommendedDimensions: {width: 2400, height: 1200},
        }}
      />,
    )

    await waitForFixtureImage()
    await expect.element(getCropSize()).toHaveAttribute('data-tone', 'critical')
    await expect
      .element(getCropSize())
      .toHaveTextContent('2000 × 1000 pxSmaller than the minimum 2400 × 600 px')
    await settleChromaticEndState()
  })

  test('previews the ratios the field allows', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<WideImageToolInputHarness options={{hotspot: true, aspectRatio: [1, 16 / 9]}} />)

    await waitForFixtureImage()
    await expect.element(page.getByRole('heading', {name: '1:1', exact: true})).toBeVisible()
    await expect.element(page.getByRole('heading', {name: '16:9', exact: true})).toBeVisible()
    expect(page.getByText('Panorama').query()).toBeNull()
    await settleChromaticEndState()
  })
})
