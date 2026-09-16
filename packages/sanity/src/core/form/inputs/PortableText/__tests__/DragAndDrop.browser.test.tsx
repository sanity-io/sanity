import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'
import {beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
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
            of: [
              defineArrayMember({
                type: 'object',
                name: 'inlineObjectWithTextProperty',
                fields: [
                  defineField({
                    type: 'string',
                    name: 'text',
                    components: {
                      input: (inputProps) => (
                        <div data-testid="inlineTextInputField">
                          {inputProps.renderDefault(inputProps)}
                        </div>
                      ),
                    },
                  }),
                ],
              }),
            ],
          }),
          defineArrayMember({
            type: 'object',
            name: 'testObjectBlock',
            fields: [{type: 'string', name: 'text'}],
            components: {
              input: (inputProps) => (
                <div data-testid="objectBlockInputField">
                  {inputProps.renderDefault(inputProps)}
                </div>
              ),
            },
          }),
        ],
      }),
    ],
  }),
]

function DragAndDropHarness({
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
      children: [{_type: 'span', _key: 'b', text: 'Foo'}],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'c',
      children: [{_type: 'span', _key: 'd', text: 'Bar'}],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'e',
      children: [{_type: 'span', _key: 'f', text: 'Baz'}],
      markDefs: [],
    },
    {
      _type: 'testObjectBlock',
      _key: 'k',
      text: 'Hello world',
    },
  ],
}

describe('Portable Text Input', () => {
  beforeEach(() => {
    window.localStorage.debug = 'sanity-pte:*'
  })

  describe('Should be able to drag and drop blocks', () => {
    it(`drag and drop blocks`, async () => {
      const {dragAndDrop, getFocusedPortableTextEditor} = testHelpers()

      void render(
        <DragAndDropHarness
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}, 'text']}
        />,
      )

      await getFocusedPortableTextEditor('field-body')

      // Drag and drop the 'Hello world' block to the position of 'Baz'
      await dragAndDrop(
        '[data-pt-editor] [draggable="true"]',
        '[data-pt-block="text"]:nth-child(3)',
      )

      // NOTE: `document` is shadowed by the SanityDocument fixture above, so
      // reach for the DOM via `window.document`.
      const fourthBlock = window.document.querySelector('[data-pt-block]:nth-child(4)')
      expect(fourthBlock?.textContent).toContain('Baz')
    })

    it(`drag and drop blocks without warning overlay`, async () => {
      const {dragWithoutDrop, getFocusedPortableTextEditor} = testHelpers()

      void render(
        <DragAndDropHarness
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}, 'text']}
        />,
      )

      await getFocusedPortableTextEditor('field-body')

      // Drag and drop the 'Hello world' block to the position of 'Baz' without dropping it
      await dragWithoutDrop(
        '[data-pt-editor] [draggable="true"]',
        '[data-pt-block="text"]:nth-child(3)',
      )

      // The "can't upload" warning is only shown for external file drags, never
      // for an internal block move. It never renders, so assert absence.
      await expect.element(page.getByText(`Can't upload this file here`)).not.toBeInTheDocument()
    })
  })
})
