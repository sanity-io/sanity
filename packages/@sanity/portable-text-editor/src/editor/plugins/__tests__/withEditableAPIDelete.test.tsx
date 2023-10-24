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
  {
    _key: 'b',
    _type: 'myTestBlockType',
    children: [
      {
        _key: 'b1',
        _type: 'span',
        marks: [],
        text: 'Block B',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
]

const initialSelection = {
  focus: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 7},
  anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 7},
}

describe('plugin:withEditableAPI: .delete()', () => {
  it('deletes block', async () => {
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
    await waitFor(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, initialSelection)
        PortableTextEditor.delete(
          editorRef.current,
          PortableTextEditor.getSelection(editorRef.current),
          {mode: 'blocks'},
        )
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
              ],
              "markDefs": Array [],
              "style": "normal",
            },
          ]
        `)
      }
    })
  })

  it('deletes all the blocks, but leaves a placeholder block', async () => {
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
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({type: 'value', value: initialValue})
      expect(onChange).toHaveBeenCalledWith({type: 'ready'})
    })

    await waitFor(() => {
      if (editorRef.current) {
        PortableTextEditor.delete(
          editorRef.current,
          {
            focus: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 7},
            anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          },
          {mode: 'blocks'},
        )
      }
    })
    await waitFor(() => {
      if (editorRef.current) {
        // New keys here confirms that a placeholder block has been created
        expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
          Array [
            Object {
              "_key": "1",
              "_type": "myTestBlockType",
              "children": Array [
                Object {
                  "_key": "2",
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
      }
    })
  })

  it('deletes children', async () => {
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

    await waitFor(() => {
      if (editorRef.current) {
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 5},
          anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 7},
        })
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.delete(
          editorRef.current,
          PortableTextEditor.getSelection(editorRef.current),
          {mode: 'children'},
        )
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
                      ],
                      "markDefs": Array [],
                      "style": "normal",
                    },
                    Object {
                      "_key": "b",
                      "_type": "myTestBlockType",
                      "children": Array [
                        Object {
                          "_key": "1",
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
      }
    })
  })
  it('deletes selected', async () => {
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

    await waitFor(() => {
      if (editorRef.current) {
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 5},
          anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
        })
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.delete(
          editorRef.current,
          PortableTextEditor.getSelection(editorRef.current),
          {mode: 'selected'},
        )
        expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
                  Array [
                    Object {
                      "_key": "b",
                      "_type": "myTestBlockType",
                      "children": Array [
                        Object {
                          "_key": "b1",
                          "_type": "span",
                          "marks": Array [],
                          "text": " B",
                        },
                      ],
                      "markDefs": Array [],
                      "style": "normal",
                    },
                  ]
              `)
      }
    })
  })
})
