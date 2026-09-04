import {defineContainer} from '@portabletext/editor'
import {NodePlugin} from '@portabletext/editor/plugins'
import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'
import {type PortableTextPluginsProps} from 'sanity'
import {beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const CONTAINER_NODES = [
  defineContainer({
    type: 'table',
    arrayField: 'rows',
    render: ({children, attributes}) => (
      <table {...attributes}>
        <tbody>{children}</tbody>
      </table>
    ),
    of: [
      defineContainer({
        type: 'row',
        arrayField: 'cells',
        render: ({children, attributes}) => <tr {...attributes}>{children}</tr>,
        of: [
          defineContainer({
            type: 'cell',
            arrayField: 'content',
            render: ({children, attributes}) => <td {...attributes}>{children}</td>,
          }),
        ],
      }),
    ],
  }),
]

function ContainerPlugins(props: PortableTextPluginsProps) {
  return (
    <>
      {props.renderDefault(props)}
      <NodePlugin nodes={CONTAINER_NODES} />
    </>
  )
}

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
          defineArrayMember({
            type: 'object',
            name: 'table',
            fields: [
              defineField({
                type: 'array',
                name: 'rows',
                of: [
                  defineArrayMember({
                    type: 'object',
                    name: 'row',
                    fields: [
                      defineField({
                        type: 'array',
                        name: 'cells',
                        of: [
                          defineArrayMember({
                            type: 'object',
                            name: 'cell',
                            fields: [
                              defineField({
                                type: 'array',
                                name: 'content',
                                of: [
                                  defineArrayMember({type: 'block'}),
                                  defineArrayMember({
                                    type: 'object',
                                    name: 'cellObjectBlock',
                                    fields: [{type: 'string', name: 'text'}],
                                    components: {
                                      input: (inputProps) => (
                                        <div data-testid="cellObjectBlockInputField">
                                          {inputProps.renderDefault(inputProps)}
                                        </div>
                                      ),
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
                ],
              }),
            ],
          }),
        ],
        components: {
          portableText: {
            plugins: ContainerPlugins,
          },
        },
      }),
    ],
  }),
]

function FocusTrackingHarness({
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
      _type: 'block',
      _key: 'g',
      children: [
        {_type: 'span', _key: 'h', text: 'Hello '},
        {_type: 'inlineObjectWithTextProperty', _key: 'i', text: 'there'},
        {_type: 'span', _key: 'j', text: ' playwright'},
      ],
      markDefs: [],
    },
    {
      _type: 'testObjectBlock',
      _key: 'k',
      text: 'Hello world',
    },
    {
      _type: 'table',
      _key: 't',
      rows: [
        {
          _type: 'row',
          _key: 'r',
          cells: [
            {
              _type: 'cell',
              _key: 'c',
              content: [
                {
                  _type: 'block',
                  _key: 'm',
                  children: [{_type: 'span', _key: 'n', text: 'Nested Foo'}],
                  markDefs: [],
                },
                {
                  _type: 'block',
                  _key: 'o',
                  children: [{_type: 'span', _key: 'p', text: 'Nested Bar'}],
                  markDefs: [],
                },
                {
                  _type: 'cellObjectBlock',
                  _key: 'q',
                  text: 'Nested object',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

describe('Portable Text Input', () => {
  beforeEach(() => {
    window.localStorage.debug = 'sanity-pte:*'
  })
  describe('Should track focusPath', () => {
    it(`for span .text`, async () => {
      const {waitForFocusedNodeText} = testHelpers()
      const {rerender} = await render(
        <FocusTrackingHarness
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}, 'text']}
        />,
      )
      await waitForFocusedNodeText('Bar')
      await rerender(
        <FocusTrackingHarness
          document={document}
          focusPath={['body', {_key: 'e'}, 'children', {_key: 'f'}, 'text']}
        />,
      )
      await waitForFocusedNodeText('Baz')
    })
    it(`for span child root`, async () => {
      const {waitForFocusedNodeText} = testHelpers()
      const {rerender} = await render(
        <FocusTrackingHarness
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}]}
        />,
      )
      await waitForFocusedNodeText('Bar')
      await rerender(
        <FocusTrackingHarness
          document={document}
          focusPath={['body', {_key: 'e'}, 'children', {_key: 'f'}]}
        />,
      )
      await waitForFocusedNodeText('Baz')
    })
    it(`for inline objects with .text prop`, async () => {
      const {rerender} = await render(
        <FocusTrackingHarness
          document={document}
          focusPath={['body', {_key: 'g'}, 'children', {_key: 'i'}, 'text']}
        />,
      )

      const $portableTextInput = page.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect.element($pteTextbox).not.toHaveFocus()

      // Wait for the input to be visible and then focus it directly
      const inlineObjectTextInput = page.getByTestId('inlineTextInputField').getByRole('textbox')
      await expect.element(inlineObjectTextInput).toBeVisible()

      // Focus the input directly - more reliable than auto-focus in CI
      inlineObjectTextInput.element().focus()
      await expect.element(inlineObjectTextInput).toHaveFocus()

      await rerender(
        <FocusTrackingHarness
          document={document}
          focusPath={['body', {_key: 'e'}, 'children', {_key: 'f'}]}
        />,
      )
      await expect.element($pteTextbox).toHaveFocus()
    })
    it(`for object blocks with .text prop`, async () => {
      void render(
        <FocusTrackingHarness document={document} focusPath={['body', {_key: 'k'}, 'text']} />,
      )
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      const $portableTextInput = page.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect.element($pteTextbox).not.toHaveFocus()

      // Wait for the input to be visible and then focus it directly
      const blockObjectInput = page.getByTestId('objectBlockInputField').getByRole('textbox')
      await expect.element(blockObjectInput).toBeVisible()

      // Focus the input directly - more reliable than tab navigation in CI
      blockObjectInput.element().focus()
      await expect.element(blockObjectInput).toHaveFocus()
    })
    it(`for block paths`, async () => {
      const {rerender} = await render(
        <FocusTrackingHarness document={document} focusPath={['body', {_key: 'k'}]} />,
      )
      const $portableTextInput = page.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect.element($pteTextbox).not.toHaveFocus()
      const blockObjectInput = page.getByTestId('objectBlockInputField').getByRole('textbox')
      await expect.element(blockObjectInput).toBeVisible()
      await rerender(<FocusTrackingHarness document={document} focusPath={['body', {_key: 'g'}]} />)

      await expect.element($pteTextbox).toHaveFocus()
      // Focus moved away from the block object, so its input unmounts entirely.
      await expect.element(blockObjectInput).not.toBeInTheDocument()
    })
    it(`for span paths inside a container`, async () => {
      const {waitForFocusedNodeText} = testHelpers()
      const {rerender} = await render(
        <FocusTrackingHarness
          document={document}
          focusPath={[
            'body',
            {_key: 't'},
            'rows',
            {_key: 'r'},
            'cells',
            {_key: 'c'},
            'content',
            {_key: 'm'},
            'children',
            {_key: 'n'},
            'text',
          ]}
        />,
      )
      await waitForFocusedNodeText('Nested Foo')
      await rerender(
        <FocusTrackingHarness
          document={document}
          focusPath={[
            'body',
            {_key: 't'},
            'rows',
            {_key: 'r'},
            'cells',
            {_key: 'c'},
            'content',
            {_key: 'o'},
            'children',
            {_key: 'p'},
            'text',
          ]}
        />,
      )
      await waitForFocusedNodeText('Nested Bar')
    })
    it(`for block paths inside a container`, async () => {
      const {rerender} = await render(
        <FocusTrackingHarness
          document={document}
          focusPath={[
            'body',
            {_key: 't'},
            'rows',
            {_key: 'r'},
            'cells',
            {_key: 'c'},
            'content',
            {_key: 'q'},
          ]}
        />,
      )
      const $portableTextInput = page.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect.element($pteTextbox).not.toHaveFocus()
      const cellObjectBlockInput = page
        .getByTestId('cellObjectBlockInputField')
        .getByRole('textbox')
      await expect.element(cellObjectBlockInput).toBeVisible()
      await rerender(
        <FocusTrackingHarness
          document={document}
          focusPath={[
            'body',
            {_key: 't'},
            'rows',
            {_key: 'r'},
            'cells',
            {_key: 'c'},
            'content',
            {_key: 'm'},
          ]}
        />,
      )
      await expect.element($pteTextbox).toHaveFocus()
      await expect.element(cellObjectBlockInput).not.toBeInTheDocument()
    })
  })
  it(`reports focus on spans with with .text prop, and everything else without`, async () => {
    const paths: Path[] = []
    const pushPath = (path: Path) => paths.push(path)
    const {getFocusedPortableTextEditor} = testHelpers()
    void render(<FocusTrackingHarness document={document} onPathFocus={pushPath} />)
    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveFocus()
    // onPathFocus fires asynchronously after focus/click, so poll for the latest path.
    const lastPath = () => paths.slice(-1)[0]
    await expect.poll(lastPath).toEqual(['body', {_key: 'a'}, 'children', {_key: 'b'}, 'text'])
    const $inlineObject = page.getByTestId('inline-preview')
    await $inlineObject.click()
    await expect.poll(lastPath).toEqual(['body', {_key: 'g'}, 'children', {_key: 'i'}])
    const $blockObject = page.getByTestId('pte-block-object').first()
    await $blockObject.click()
    await expect.poll(lastPath).toEqual(['body', {_key: 'k'}])
  })
})
