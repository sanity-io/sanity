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
        text: "It's a beautiful day on planet earth",
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
        text: 'The birds are singing',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
]

describe('plugin:withPortableTextSelections', () => {
  it('will report that a selection is made backward', async () => {
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
    const initialSelection = {
      anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 9},
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 7},
    }
    await waitFor(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, initialSelection)
        expect(PortableTextEditor.getSelection(editorRef.current)).toMatchInlineSnapshot(`
          Object {
            "anchor": Object {
              "offset": 9,
              "path": Array [
                Object {
                  "_key": "b",
                },
                "children",
                Object {
                  "_key": "b1",
                },
              ],
            },
            "backward": true,
            "focus": Object {
              "offset": 7,
              "path": Array [
                Object {
                  "_key": "a",
                },
                "children",
                Object {
                  "_key": "a1",
                },
              ],
            },
          }
        `)
      }
    })
  })
})
