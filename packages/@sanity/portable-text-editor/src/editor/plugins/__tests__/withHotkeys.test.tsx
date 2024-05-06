import {describe, expect, it, jest} from '@jest/globals'
import {render, waitFor} from '@testing-library/react'
import {createRef, type RefObject} from 'react'

import {PortableTextEditorTester, schemaType} from '../../__tests__/PortableTextEditorTester'
import {getEditableElement, triggerKeyboardEvent} from '../../__tests__/utils'
import {PortableTextEditor} from '../../PortableTextEditor'

const newBlock = {
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
}
describe('plugin:withHotkeys: .ArrowDown', () => {
  it('a new block is added if the user is focused on the only block which is void, and presses arrow down.', async () => {
    const initialValue = [
      {
        _key: 'a',
        _type: 'someObject',
      },
    ]

    const initialSelection = {
      focus: {path: [{_key: 'a'}], offset: 0},
      anchor: {path: [{_key: 'a'}], offset: 0},
    }

    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    const component = render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    const element = await getEditableElement(component)

    const editor = editorRef.current
    const inlineType = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')
    await waitFor(async () => {
      if (editor && inlineType && element) {
        PortableTextEditor.focus(editor)
        PortableTextEditor.select(editor, initialSelection)
        PortableTextEditor.insertBreak(editor)
        await triggerKeyboardEvent('ArrowDown', element)

        const value = PortableTextEditor.getValue(editor)
        expect(value).toEqual([initialValue[0], newBlock])
      }
    })
  })
  it('a new block is added if the user is focused on the last block which is void, and presses arrow down.', async () => {
    const initialValue = [
      {
        _type: 'myTestBlockType',
        _key: 'a',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'a1',
            text: 'This is the first block',
            marks: [],
          },
        ],
      },
      {
        _key: 'b',
        _type: 'someObject',
      },
    ]
    const initialSelection = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 2},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 2},
    }

    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    const component = render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    const element = await getEditableElement(component)

    const editor = editorRef.current
    const inlineType = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')
    await waitFor(async () => {
      if (editor && inlineType && element) {
        PortableTextEditor.focus(editor)
        PortableTextEditor.select(editor, initialSelection)
        await triggerKeyboardEvent('ArrowDown', element)
        const value = PortableTextEditor.getValue(editor)
        // Arrow down on the text block should not add a new block
        expect(value).toEqual(initialValue)
        // Focus on the object block
        PortableTextEditor.select(editor, {
          focus: {path: [{_key: 'b'}], offset: 0},
          anchor: {path: [{_key: 'b'}], offset: 0},
        })
        await triggerKeyboardEvent('ArrowDown', element)
        const value2 = PortableTextEditor.getValue(editor)
        expect(value2).toEqual([
          initialValue[0],
          initialValue[1],
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
        ])
      }
    })
  })
})
describe('plugin:withHotkeys: .ArrowUp', () => {
  it('a new block is added at the top, when pressing arrow up, because first block is void, the new block can be deleted with backspace.', async () => {
    const initialValue = [
      {
        _key: 'b',
        _type: 'someObject',
      },
      {
        _type: 'myTestBlockType',
        _key: 'a',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'a1',
            text: 'This is the first block',
            marks: [],
          },
        ],
      },
    ]

    const initialSelection = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 2},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 2},
    }

    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    const component = render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    const element = await getEditableElement(component)

    const editor = editorRef.current
    const inlineType = editor?.schemaTypes.inlineObjects.find((t) => t.name === 'someObject')
    await waitFor(async () => {
      if (editor && inlineType && element) {
        PortableTextEditor.focus(editor)
        PortableTextEditor.select(editor, initialSelection)
        await triggerKeyboardEvent('ArrowUp', element)
        // Arrow down on the text block should not add a new block
        expect(PortableTextEditor.getValue(editor)).toEqual(initialValue)
        // Focus on the object block
        PortableTextEditor.select(editor, {
          focus: {path: [{_key: 'b'}], offset: 0},
          anchor: {path: [{_key: 'b'}], offset: 0},
        })
        await triggerKeyboardEvent('ArrowUp', element)
        expect(PortableTextEditor.getValue(editor)).toEqual([
          newBlock,
          initialValue[0],
          initialValue[1],
        ])
        // Pressing arrow up again won't add a new block
        await triggerKeyboardEvent('ArrowUp', element)
        expect(PortableTextEditor.getValue(editor)).toEqual([
          newBlock,
          initialValue[0],
          initialValue[1],
        ])
        await triggerKeyboardEvent('Backspace', element)
        expect(PortableTextEditor.getValue(editor)).toEqual(initialValue)
      }
    })
  })
})
