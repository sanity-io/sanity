import {
  defineField,
  defineType,
  type ImageSchemaType,
  type ImageValue,
  type SanityDocument,
} from '@sanity/types'
import {
  getCroppedImageDimensions,
  dimensionsMatchConstraint,
  resolveAspectRatio,
} from '@sanity/util/image'
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
const PORTRAIT_IMAGE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-1200x1800-jpg'
const PORTRAIT_WIDTH = 1200
const PORTRAIT_HEIGHT = 1800
const WIDESCREEN = resolveAspectRatio(16 / 9)
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

const VECTOR_WARNING =
  "Warning: Hotspot and crop might not be applied to this image where it's presented."

const SVG_DOCUMENT: SanityDocument = {
  ...DOCUMENT,
  image: {
    _type: 'image',
    asset: {_type: 'reference', _ref: 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-100x100-svg'},
  },
}

function SvgImageToolInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={SVG_DOCUMENT} />
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
const HOTSPOT_FOCUS_PATH = ['image', 'hotspot']

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

describe('image tool input', () => {
  test('renders the hotspot and crop tool', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ImageToolInputHarness />)

    await waitForFixtureImage()
    await expect.element(page.getByText('Hotspot & Crop')).toBeVisible()
    await settleChromaticEndState()
  })

  test('warns that hotspot and crop might not apply to an SVG asset', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<SvgImageToolInputHarness />)

    await waitForFixtureImage()
    await expect.element(page.getByText(VECTOR_WARNING)).toBeVisible()
    await settleChromaticEndState()
  })

  test('shows no vector warning for a raster asset', async () => {
    void render(<ImageToolInputHarness />)

    await waitForFixtureImage()
    await expect.element(page.getByText('Hotspot & Crop')).toBeVisible()
    await expect.element(page.getByText(VECTOR_WARNING)).not.toBeInTheDocument()
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

    ;(cropRect.element() as SVGRectElement).focus()
    const modifier = getModifierKey()
    await userEvent.keyboard(`{${modifier}>}{ArrowLeft}{/${modifier}}`)

    const state = await waitForDocumentState((documentState) => Boolean(documentState?.image?.crop))
    const dimensions = getCroppedImageDimensions(state.image) ?? {width: 0, height: 0}
    expect(dimensionsMatchConstraint(dimensions, resolveAspectRatio(1))).toBe(true)
    expect(dimensions.width).toBeLessThan(1000)
    expect(dimensions.width).toBeGreaterThanOrEqual(600)
    expect(state.image.hotspot).toBeUndefined()
    await settleChromaticEndState()
  })

  describe('on a portrait image in a 16:9 field', () => {
    const WIDESCREEN_SCHEMA = createImageSchema({
      hotspot: true,
      aspectRatio: 16 / 9,
      minDimensions: {width: 800, height: 450},
    })

    function PortraitHarness(props: {crop?: ImageValue['crop']}) {
      const document: SanityDocument = {
        ...DOCUMENT,
        image: {
          _type: 'image',
          asset: {_type: 'reference', _ref: PORTRAIT_IMAGE_REF},
          ...(props.crop && {crop: props.crop}),
        },
      }
      return (
        <TestWrapper schemaTypes={WIDESCREEN_SCHEMA}>
          <TestForm document={document} focusPath={HOTSPOT_FOCUS_PATH} />
        </TestWrapper>
      )
    }

    async function findCropRect() {
      const {findBySelector} = testHelpers()
      const cropRect = await findBySelector(
        {element: () => document.body},
        'rect[data-handle="crop"][tabindex]',
      )
      return cropRect.element() as SVGRectElement
    }

    async function readDrawnSourceRatio() {
      const {findBySelector} = testHelpers()
      const background = await findBySelector({element: () => document.body}, 'svg > image')
      const backgroundImage = background.element() as SVGImageElement
      const cropRect = await findCropRect()
      const widthFraction = cropRect.width.baseVal.value / backgroundImage.width.baseVal.value
      const heightFraction = cropRect.height.baseVal.value / backgroundImage.height.baseVal.value
      return (widthFraction * PORTRAIT_WIDTH) / (heightFraction * PORTRAIT_HEIGHT)
    }

    test('draws an uncropped image at the required ratio without editing the document', async () => {
      const {waitForDocumentState} = testHelpers()
      void render(<PortraitHarness />)

      await waitForFixtureImage()
      expect(await readDrawnSourceRatio()).toBeCloseTo(16 / 9, 2)
      const state = await waitForDocumentState((documentState) => Boolean(documentState?.image))
      expect(state.image.crop).toBeUndefined()
      expect(state.image.hotspot).toBeUndefined()
    })

    test('draws a stored crop at the wrong ratio at the required ratio', async () => {
      void render(
        <PortraitHarness
          crop={{_type: 'sanity.imageCrop', top: 0, bottom: 1 / 3, left: 0, right: 0}}
        />,
      )

      await waitForFixtureImage()
      expect(await readDrawnSourceRatio()).toBeCloseTo(16 / 9, 2)
    })

    test('commits a crop that passes the ratio when the editor moves the box', async () => {
      const {waitForDocumentState} = testHelpers()
      void render(<PortraitHarness />)

      await waitForFixtureImage()
      const cropRect = await findCropRect()
      cropRect.focus()
      await userEvent.keyboard('{ArrowDown}')

      const state = await waitForDocumentState((documentState) =>
        Boolean(documentState?.image?.crop),
      )
      const dimensions = getCroppedImageDimensions(state.image) ?? {width: 0, height: 0}
      expect(dimensionsMatchConstraint(dimensions, WIDESCREEN)).toBe(true)
      expect(dimensions.width).toBeGreaterThanOrEqual(800)
      expect(dimensions.height).toBeGreaterThanOrEqual(450)
    })
  })
})
