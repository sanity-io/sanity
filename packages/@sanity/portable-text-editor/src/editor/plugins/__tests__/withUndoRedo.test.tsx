import {describe, expect, it, jest} from '@jest/globals'
import {render, waitFor} from '@testing-library/react'
import {createRef, type RefObject} from 'react'

import {PortableTextEditorTester, schemaType} from '../../__tests__/PortableTextEditorTester'
import {PortableTextEditor} from '../../PortableTextEditor'

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

describe('plugin:withUndoRedo', () => {
  it('preserves the keys when undoing ', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
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
        PortableTextEditor.undo(editorRef.current)
        expect(PortableTextEditor.getValue(editorRef.current)).toEqual(initialValue)
      }
    })
  })
  it('preserves the keys when redoing ', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
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
        PortableTextEditor.insertBlock(editorRef.current, editorRef.current.schemaTypes.block, {
          children: [{_key: 'c1', _type: 'span', marks: [], text: 'Block C'}],
        })
        const producedKey = PortableTextEditor.getValue(editorRef.current)?.slice(-1)[0]?._key
        PortableTextEditor.undo(editorRef.current)
        PortableTextEditor.redo(editorRef.current)
        expect(PortableTextEditor.getValue(editorRef.current)?.slice(-1)[0]?._key).toEqual(
          producedKey,
        )
      }
    })
  })
})
