/**
 * @jest-environment ./test/setup/jsdom.jest.env.ts
 */
/* eslint-disable no-irregular-whitespace */
// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {act} from 'react-dom/test-utils'
import {render} from '@testing-library/react'

import React from 'react'
import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextEditorTester, type} from './PortableTextEditor.test'

describe('marks', () => {
  it('splits correctly when adding marks', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [
      {
        _key: 'a',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'a1',
            _type: 'span',
            marks: [],
            text: '123',
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
            text: '123',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]
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
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 1},
        })
      }
    })
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.toggleMark(editorRef.current, 'bold')
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
              "marks": Array [
                "bold",
              ],
              "text": "123",
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
              "_key": "b1",
              "_type": "span",
              "marks": Array [
                "bold",
              ],
              "text": "1",
            },
            Object {
              "_key": "1",
              "_type": "span",
              "marks": Array [],
              "text": "23",
            },
          ],
          "markDefs": Array [],
          "style": "normal",
        },
      ]
    `)
  })
})
