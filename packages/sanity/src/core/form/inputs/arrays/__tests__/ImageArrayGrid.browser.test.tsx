import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

/**
 * Schema from https://github.com/sanity-io/sanity/issues/15210.
 * An array of images named `image`, with an alt string and grid layout.
 */
const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        name: 'photos',
        type: 'array',
        of: [
          defineArrayMember({
            name: 'image',
            type: 'image',
            title: 'Photo',
            options: {hotspot: true},
            fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
          }),
        ],
        options: {layout: 'grid'},
      }),
    ],
  }),
]

const ASSET = {
  _type: 'reference' as const,
  _ref: 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-100x100-jpg',
}

const UPLOADED: SanityDocument = {
  _id: 'album',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '1',
  photos: [{_key: 'a', _type: 'image', asset: ASSET}],
}

function Harness({document}: {document?: SanityDocument}) {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm document={document} />
    </TestWrapper>
  )
}

function readPhotos(): unknown[] | undefined {
  const state = (window as Window & {documentState?: {photos?: unknown[]}}).documentState
  return state?.photos
}

describe('image array grid', () => {
  test('closing the dialog drops an empty image item', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<Harness />)

    await userEvent.click(page.getByTestId('add-single-object-button'))
    await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()
    await expect.element(page.getByText('Drag or paste image here')).toBeVisible()

    await userEvent.click(page.getByRole('button', {name: 'Close dialog'}))

    await expect.poll(() => readPhotos()?.length ?? 0).toBe(0)
    await expect
      .poll(() => document.querySelectorAll('[data-testid="media-preview"]').length)
      .toBe(0)
    await settleChromaticEndState()
  })

  test('closing the dialog keeps an image that has an asset', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<Harness document={UPLOADED} />)

    await expect
      .poll(() => document.querySelectorAll('[data-testid="media-preview"]').length)
      .toBe(1)
    await userEvent.click(page.getByTestId('media-preview'))
    await expect.element(page.getByText('Alternative text')).toBeVisible()

    await userEvent.click(page.getByRole('button', {name: 'Close dialog'}))

    await expect.poll(() => readPhotos()?.length ?? 0).toBe(1)
    await expect
      .poll(() => document.querySelectorAll('[data-testid="media-preview"]').length)
      .toBe(1)
    await settleChromaticEndState()
  })
})
