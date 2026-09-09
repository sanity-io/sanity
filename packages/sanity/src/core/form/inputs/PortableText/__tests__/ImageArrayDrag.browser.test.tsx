import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({
            type: 'block',
          }),
          defineArrayMember({
            type: 'object',
            name: 'imageSlideshow',
            title: 'Image slideshow',
            fields: [
              defineField({
                name: 'images',
                type: 'array',
                title: 'Images',
                of: [
                  defineArrayMember({
                    type: 'image',
                    options: {
                      hotspot: true,
                    },
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  }),
]

function ImageArrayDragHarness({
  focusPath,
  onPathFocus,
  document,
}: {
  focusPath?: Path
  onPathFocus?: (path: Path) => void
  document?: SanityDocument
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} focusPath={focusPath} onPathFocus={onPathFocus} />
    </TestWrapper>
  )
}

const {render} = await import('vitest-browser-react')

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'a',
      children: [{_type: 'span', _key: 'b', text: 'Test content'}],
      markDefs: [],
    },
  ],
}

describe('Portable Text Input - ImageArrayDrag', () => {
  it('Array Input of images dragging an image will not trigger range out of bounds (toast)', async () => {
    const {dragAndDrop, getFocusedPortableTextEditor} = testHelpers()

    void render(<ImageArrayDragHarness document={document} focusPath={['body']} />)

    const $pte = await getFocusedPortableTextEditor('field-body')

    // Wait for the text block to be editable
    await expect
      .element(page.getByRole('button', {name: 'Insert Image slideshow (block)'}))
      .toBeVisible()

    // Open the insert menu
    await page
      .getByTestId('insert-menu-auto-collapse-menu')
      .getByRole('button', {name: 'Insert Image slideshow (block)'})
      .click()

    await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

    // Close the dialog to create an empty image slideshow block
    await page.getByRole('button', {name: 'Close dialog'}).click()

    await expect.element(page.getByTestId('nested-object-dialog')).not.toBeInTheDocument()

    // Wait for the block object to be rendered
    await expect.element(page.getByTestId('pte-block-object')).toBeVisible()

    // Drag the block to a different position
    await dragAndDrop('[data-pt-editor] [draggable="true"]', '[data-testid="text-block"]')

    // Check that no error toast appeared (the range-out-of-bounds toast)
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
  })
})
