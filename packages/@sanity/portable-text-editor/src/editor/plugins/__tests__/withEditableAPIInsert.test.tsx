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

const emptyTextBlock = [
  {
    _key: 'emptyBlock',
    _type: 'myTestBlockType',
    children: [
      {
        _key: 'emptySpan',
        _type: 'span',
        marks: [],
        text: '',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
]
const emptyBlockSelection = {
  focus: {path: [{_key: 'emptyBlock'}, 'children', {_key: 'emptySpan'}], offset: 0},
  anchor: {path: [{_key: 'emptyBlock'}, 'children', {_key: 'emptySpan'}], offset: 0},
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

describe('plugin:withEditableAPI: .insertBlock()', () => {
  it('should not add empty blank blocks: empty block', async () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={emptyTextBlock}
      />,
    )
    const editor = editorRef.current
    const someObject = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')

    await waitFor(() => {
      if (editorRef.current && someObject) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, emptyBlockSelection)
        PortableTextEditor.insertBlock(editorRef.current, someObject, {color: 'red'})

        expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
          {_key: '2', _type: 'someObject', color: 'red'},
        ])
      } else {
        throw new Error('No editor or someObject')
      }
    })
  })

  it('should not add empty blank blocks: non-empty block', async () => {
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
    const someObject = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')

    await waitFor(() => {
      if (editorRef.current && someObject) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, initialSelection)
        PortableTextEditor.insertBlock(editorRef.current, someObject, {color: 'red'})
        expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
          ...initialValue,
          {_key: '2', _type: 'someObject', color: 'red'},
        ])
      } else {
        throw new Error('No editor or someObject')
      }
    })
  })
  it('should be inserted before if focus is on start of block', async () => {
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
    const someObject = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')

    await waitFor(() => {
      if (editorRef.current && someObject) {
        PortableTextEditor.focus(editorRef.current)
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
          anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
        })
        PortableTextEditor.insertBlock(editorRef.current, someObject, {color: 'red'})
        expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
          {_key: '2', _type: 'someObject', color: 'red'},
          ...initialValue,
        ])
      } else {
        throw new Error('No editor or someObject')
      }
    })
  })
  it('should not add empty blank blocks: non text block', async () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    const value = [...initialValue, {_key: 'b', _type: 'someObject', color: 'red'}]
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={value}
      />,
    )
    const editor = editorRef.current
    const someObject = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')

    await waitFor(() => {
      if (editorRef.current && someObject) {
        PortableTextEditor.focus(editorRef.current)
        // Focus the `someObject` block
        PortableTextEditor.select(editorRef.current, {
          focus: {path: [{_key: 'b'}], offset: 0},
          anchor: {path: [{_key: 'b'}], offset: 0},
        })
        PortableTextEditor.insertBlock(editorRef.current, someObject, {color: 'yellow'})
        expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
          ...value,
          {_key: '2', _type: 'someObject', color: 'yellow'},
        ])
      } else {
        throw new Error('No editor or someObject')
      }
    })
  })
  it('should not add empty blank blocks: in between blocks', async () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    const value = [...initialValue, {_key: 'b', _type: 'someObject', color: 'red'}]
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={value}
      />,
    )
    const editor = editorRef.current
    const someObject = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')

    await waitFor(() => {
      if (editorRef.current && someObject) {
        PortableTextEditor.focus(editorRef.current)
        // Focus the `text` block
        PortableTextEditor.select(editorRef.current, initialSelection)
        PortableTextEditor.insertBlock(editorRef.current, someObject, {color: 'yellow'})
        expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
          value[0],
          {_key: '2', _type: 'someObject', color: 'yellow'},
          value[1],
        ])
      } else {
        throw new Error('No editor or someObject')
      }
    })
  })
  it('should not add empty blank blocks: in new empty text block', async () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    const value = [...initialValue, ...emptyTextBlock]
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={value}
      />,
    )
    const editor = editorRef.current
    const someObject = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')

    await waitFor(() => {
      if (editorRef.current && someObject) {
        PortableTextEditor.focus(editorRef.current)
        // Focus the empty `text` block
        PortableTextEditor.select(editorRef.current, emptyBlockSelection)
        PortableTextEditor.insertBlock(editorRef.current, someObject, {color: 'yellow'})
        expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
          value[0],
          {_key: '2', _type: 'someObject', color: 'yellow'},
        ])
      } else {
        throw new Error('No editor or someObject')
      }
    })
  })
})
