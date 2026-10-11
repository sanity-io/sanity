import {defineField, defineType, type ImageValue, type SanityDocument} from '@sanity/types'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type ImageInputProps} from '../../../../studio/inputs/StudioImageInput'
import {type ObjectInputProps} from '../../../../types/inputProps'
import {ImageToolInput} from '../ImageToolInput'

const IMAGE_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const IMAGE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-100x100-jpg'
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

function ImageToolSchemaInput(props: SchemaImageInputProps) {
  return <ImageToolInput {...(props as ImageInputProps)} imageUrl={IMAGE_URL} />
}

const SCHEMA = [
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
        components: {input: ImageToolSchemaInput},
      }),
    ],
  }),
]

function ImageToolInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={DOCUMENT} />
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
})
