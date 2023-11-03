import {render, waitFor} from '@testing-library/react'

import React from 'react'
import {PortableTextEditor} from '../../PortableTextEditor'
import {PortableTextEditorTester, schemaType} from '../../__tests__/PortableTextEditorTester'

const initialValue = [
  {
    _key: 'a',
    _type: 'myTestBlockType',
    children: [
      {
        _key: 'a1',
        _type: 'span',
        marks: [],
        text: 'Block A',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
]

const initialSelection = {
  focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 7},
  anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 7},
}

describe('plugin:withEditableAPI: .insertChild()', () => {
  it('inserts child nodes correctly', async () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    const editor = editorRef.current
    const inlineType = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')
    await waitFor(() => {
      if (editor && inlineType) {
        PortableTextEditor.focus(editor)
        PortableTextEditor.select(editor, initialSelection)
        PortableTextEditor.insertChild(editorRef.current, inlineType, {color: 'red'})
        expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
          Array [
            Object {
              "_key": "a",
              "_type": "myTestBlockType",
              "children": Array [
                Object {
                  "_key": "a1",
                  "_type": "span",
                  "marks": Array [],
                  "text": "Block A",
                },
                Object {
                  "_key": "3",
                  "_type": "someObject",
                  "color": "red",
                },
                Object {
                  "_key": "4",
                  "_type": "span",
                  "marks": Array [],
                  "text": "",
                },
              ],
              "markDefs": Array [],
              "style": "normal",
            },
          ]
        `)
        PortableTextEditor.insertChild(editor, editor.schemaTypes.span, {text: ' '})
        expect(PortableTextEditor.getValue(editor)).toMatchInlineSnapshot(`
          Array [
            Object {
              "_key": "a",
              "_type": "myTestBlockType",
              "children": Array [
                Object {
                  "_key": "a1",
                  "_type": "span",
                  "marks": Array [],
                  "text": "Block A",
                },
                Object {
                  "_key": "3",
                  "_type": "someObject",
                  "color": "red",
                },
                Object {
                  "_key": "7",
                  "_type": "span",
                  "marks": Array [],
                  "text": " ",
                },
              ],
              "markDefs": Array [],
              "style": "normal",
            },
          ]
        `)
        const sel = PortableTextEditor.getSelection(editor)
        expect(sel).toMatchInlineSnapshot(`
          Object {
            "anchor": Object {
              "offset": 1,
              "path": Array [
                Object {
                  "_key": "a",
                },
                "children",
                Object {
                  "_key": "7",
                },
              ],
            },
            "focus": Object {
              "offset": 1,
              "path": Array [
                Object {
                  "_key": "a",
                },
                "children",
                Object {
                  "_key": "7",
                },
              ],
            },
          }
        `)
      }
    })
  })
})
