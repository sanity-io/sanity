import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// A table-enabled field whose cells hold spans and inline objects, for
// pinning the focus-path span suffix (`.text`) at container depth.
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
          defineArrayMember({type: 'block'}),
          defineArrayMember({
            type: 'object',
            name: 'table',
            fields: [
              defineField({type: 'number', name: 'headerRows'}),
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
                                name: 'value',
                                of: [
                                  defineArrayMember({
                                    type: 'block',
                                    of: [
                                      defineArrayMember({
                                        type: 'object',
                                        name: 'inlineNote',
                                        title: 'Inline note',
                                        fields: [
                                          defineField({
                                            type: 'string',
                                            name: 'note',
                                          }),
                                        ],
                                        preview: {select: {title: 'note'}},
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
          }),
        ],
        components: {
          portableText: {
            plugins: (props) =>
              props.renderDefault({
                ...props,
                plugins: {
                  ...props.plugins,
                  table: {enabled: true},
                },
              }),
          },
        },
      }),
    ],
  }),
]

function FocusPathDepthHarness(props: {
  document?: SanityDocument
  onPathFocus?: (path: Path) => void
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={props.document} onPathFocus={props.onPathFocus} />
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
      _key: 'b0',
      children: [{_type: 'span', _key: 's0', text: 'root span', marks: []}],
      markDefs: [],
      style: 'normal',
    },
    {
      _type: 'table',
      _key: 't0',
      headerRows: 0,
      rows: [
        {
          _type: 'row',
          _key: 'r0',
          cells: [
            {
              _type: 'cell',
              _key: 'c0',
              value: [
                {
                  _type: 'block',
                  _key: 'cb0',
                  children: [
                    {_type: 'span', _key: 'cs0', text: 'cell span', marks: []},
                    {_type: 'inlineNote', _key: 'cn0', note: 'deep note'},
                    {_type: 'span', _key: 'cs1', text: '', marks: []},
                  ],
                  markDefs: [],
                  style: 'normal',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

describe('Portable Text Input - focus path span suffix at depth', () => {
  it('reports spans with `.text` and inline objects without, at root and inside table cells', async () => {
    const paths: Path[] = []
    const pushPath = (path: Path) => paths.push(path)
    const {getFocusedPortableTextEditor, waitForFocusedNodeText} = testHelpers()

    void render(<FocusPathDepthHarness document={document} onPathFocus={pushPath} />)

    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveTextContent('cell span')
    const lastPath = () => paths.slice(-1)[0]

    const rootNode = [...$pte.element().querySelectorAll('*')].find(
      (node) => node.childElementCount === 0 && node.textContent === 'root span',
    )
    await userEvent.click(rootNode as HTMLElement)
    await waitForFocusedNodeText('root span')
    await expect.poll(lastPath).toEqual(['body', {_key: 'b0'}, 'children', {_key: 's0'}, 'text'])

    const cellNode = [...$pte.element().querySelectorAll('*')].find(
      (node) => node.childElementCount === 0 && node.textContent === 'cell span',
    )
    await userEvent.click(cellNode as HTMLElement)
    await waitForFocusedNodeText('cell span')
    await expect
      .poll(lastPath)
      .toEqual([
        'body',
        {_key: 't0'},
        'rows',
        {_key: 'r0'},
        'cells',
        {_key: 'c0'},
        'value',
        {_key: 'cb0'},
        'children',
        {_key: 'cs0'},
        'text',
      ])

    // An inline object is a child but not a span, so its reported path
    // stays suffix-free; a span check by path shape would get this wrong
    // at depth.
    const $inlineObject = page.getByTestId('inline-preview')
    await $inlineObject.click()
    await expect
      .poll(lastPath)
      .toEqual([
        'body',
        {_key: 't0'},
        'rows',
        {_key: 'r0'},
        'cells',
        {_key: 'c0'},
        'value',
        {_key: 'cb0'},
        'children',
        {_key: 'cn0'},
      ])
  })
})
