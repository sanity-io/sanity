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

describe('plugin:withInsertBreak: "enter"', () => {
  it('keeps text block key if enter is pressed at the start of the block, creating a new one in "before" position', async () => {
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
        PortableTextEditor.insertBreak(editor)

        const value = PortableTextEditor.getValue(editor)
        expect(value).toEqual([
          initialValue[0],
          {
            _type: 'myTestBlockType',
            _key: '3',
            style: 'normal',
            markDefs: [],
            children: [
              {
                _type: 'span',
                _key: '2',
                text: '',
                marks: [],
              },
            ],
          },
          initialValue[1],
        ])
      }
    })
  })
  it('inserts the new block after if key enter is pressed at the start of the block, creating a new one in "after" position if the block is empty', async () => {
    const initialSelection = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 0},
    }
    const emptyBlock = {
      _key: 'a',
      _type: 'myTestBlockType',
      children: [
        {
          _key: 'a1',
          _type: 'span',
          marks: [],
          text: '',
        },
      ],
      markDefs: [],
      style: 'normal',
    }

    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={[emptyBlock]}
      />,
    )
    const editor = editorRef.current
    const inlineType = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')
    await waitFor(async () => {
      if (editor && inlineType) {
        PortableTextEditor.focus(editor)
        PortableTextEditor.select(editor, initialSelection)
        PortableTextEditor.insertBreak(editor)

        const value = PortableTextEditor.getValue(editor)
        expect(value).toEqual([
          emptyBlock,
          {
            _key: '2',
            _type: 'myTestBlockType',
            markDefs: [],
            style: 'normal',
            children: [
              {
                _key: '1',
                _type: 'span',
                marks: [],
                text: '',
              },
            ],
          },
        ])
      }
    })
  })
  it('splits the text block key if enter is pressed at the middle of the block', async () => {
    const initialSelection = {
      focus: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 2},
      anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 2},
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
        PortableTextEditor.insertBreak(editor)

        const value = PortableTextEditor.getValue(editor)
        expect(value).toEqual([
          initialValue[0],
          {
            _key: 'b',
            _type: 'myTestBlockType',
            children: [
              {
                _key: 'b1',
                _type: 'span',
                marks: [],
                text: 'Bl',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
          {
            _key: '2',
            _type: 'myTestBlockType',
            markDefs: [],
            style: 'normal',
            children: [
              {
                _key: '1',
                _type: 'span',
                marks: [],
                text: 'ock B',
              },
            ],
          },
        ])
      }
    })
  })
})
