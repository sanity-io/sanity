import {describe, expect, it, jest} from '@jest/globals'
import {render, waitFor} from '@testing-library/react'
import {createRef, type RefObject} from 'react'

import {PortableTextEditorTester, schemaType} from '../__tests__/PortableTextEditorTester'
import {PortableTextEditor} from '../PortableTextEditor'

const initialValue = [
  {
    _key: '77071c3af231',
    _type: 'myTestBlockType',
    children: [
      {
        _key: 'c001f0e92c1f0',
        _type: 'span',
        marks: [],
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
]

describe('useSyncValue', () => {
  it('updates span text', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    const syncedValue = [
      {
        _key: '77071c3af231',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'c001f0e92c1f0',
            _type: 'span',
            marks: [],
            text: 'Lorem my ipsum!',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]
    const {rerender} = render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    rerender(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={syncedValue}
      />,
    )
    await waitFor(() => {
      if (editorRef.current) {
        expect(PortableTextEditor.getValue(editorRef.current)).toEqual(syncedValue)
      }
    })
  })
  it('replaces span nodes with different keys inside the same children array', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    const syncedValue = [
      {
        _key: '77071c3af231',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'c001f0e92c1f0__NEW_KEY_YA!',
            _type: 'span',
            marks: [],
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]
    const {rerender} = render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    rerender(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={syncedValue}
      />,
    )
    await waitFor(() => {
      if (editorRef.current) {
        expect(PortableTextEditor.getValue(editorRef.current)).toMatchInlineSnapshot(`
          Array [
            Object {
              "_key": "77071c3af231",
              "_type": "myTestBlockType",
              "children": Array [
                Object {
                  "_key": "c001f0e92c1f0__NEW_KEY_YA!",
                  "_type": "span",
                  "marks": Array [],
                  "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ",
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
