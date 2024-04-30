import {describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
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

describe('plugin:withHotKeys: "enter"', () => {
  it('keeps text block key if enter is pressed at the start of the block', async () => {
    const initialSelection = {
      focus: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 0},
      anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 0},
    }

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
    const editor = editorRef.current
    const inlineType = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')
    await waitFor(async () => {
      if (editor && inlineType) {
        PortableTextEditor.focus(editor)
        PortableTextEditor.select(editor, initialSelection)

        const textBox = screen.getByRole('textbox')
        if (!textBox) throw new Error('No textBox found')
        fireEvent.keyPress(textBox, {key: 'Enter', code: 'Enter', charCode: 13})

        const value = PortableTextEditor.getValue(editor)
        expect(value).toMatchInlineSnapshot(`
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
    "_key": "newKey",
    "_type": "myTestBlockType",
    "children": Array [
      Object {
        "_key": "newKey", 
        "_type": "span",
        "marks": Array [],
        "text": "",
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
        "marks": Array [],
        "text": "Block B",
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
