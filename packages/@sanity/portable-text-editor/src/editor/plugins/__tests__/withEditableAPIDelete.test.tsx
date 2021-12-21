/**
 * @jest-environment ./test/setup/jsdom.jest.env.ts
 */
/* eslint-disable no-irregular-whitespace */
// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {act} from 'react-dom/test-utils'
import {render} from '@testing-library/react'

import React from 'react'
import {PortableTextEditor} from '../../PortableTextEditor'
import {PortableTextEditorTester, type} from '../../__tests__/PortableTextEditorTester'

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
  it('deletes block', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    act(() => {
      render(
        <PortableTextEditorTester
          onChange={onChange}
          ref={editorRef}
          type={type}
          value={initialValue}
        />
      )
    })
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, initialSelection)
      }
    })
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.delete(
          editorRef.current,
          PortableTextEditor.getSelection(editorRef.current),
          {mode: 'block'}
        )
      }
    })
    expect(editorRef.current && PortableTextEditor.getValue(editorRef.current))
      .toMatchInlineSnapshot(`
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
  })
  it('deletes children', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    act(() => {
      render(
        <PortableTextEditorTester
          onChange={onChange}
          ref={editorRef}
          type={type}
          value={initialValue}
        />
      )
    })
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, initialSelection)
      }
    })
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.delete(
          editorRef.current,
          PortableTextEditor.getSelection(editorRef.current),
          {mode: 'children'}
        )
      }
    })
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
  })
})
