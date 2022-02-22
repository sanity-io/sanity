/**
 * @jest-environment ./test/setup/jsdom.jest.env.ts
 */
// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {act} from 'react-dom/test-utils'
import {render} from '@testing-library/react'

import React from 'react'
import {PortableTextEditor} from '../../editor/PortableTextEditor'
import {PortableTextEditorTester, type} from '../../editor/__tests__/PortableTextEditorTester'

describe('values: normalization', () => {
  it("accepts incoming value with blocks without a style or markDefs prop, but doesn't leave them without them when editing them", () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [
      {
        _key: '5fc57af23597',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'be1c67c6971a',
            _type: 'span',
            marks: [],
            text: 'Hello',
          },
        ],
        markDefs: [],
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
          focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}], offset: 0},
          anchor: {path: [{_key: '5fc57af23597'}, 'children', {_key: 'be1c67c6971a'}], offset: 5},
        })
      }
    })
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.toggleMark(editorRef.current, 'strong')
      }
    })
    expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
      {
        _key: '5fc57af23597',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'be1c67c6971a',
            _type: 'span',
            marks: ['strong'],
            text: 'Hello',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ])
  })
})
