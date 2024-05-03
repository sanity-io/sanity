import {describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, waitFor} from '@testing-library/react'
import {createRef, type RefObject} from 'react'

import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextEditorTester, schemaType} from './PortableTextEditorTester'
import {getEditableElement} from './utils'

describe('adds empty text block if its needed', () => {
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
  it('adds a new block at the bottom, when clicking on the portable text editor, because the only block is void and user is focused on that one', async () => {
    const initialValue = [
      {
        _key: 'b',
        _type: 'someObject',
      },
    ]

    const initialSelection = {
      focus: {path: [{_key: 'b'}], offset: 0},
      anchor: {path: [{_key: 'b'}], offset: 0},
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
        fireEvent.click(element)
        expect(PortableTextEditor.getValue(editor)).toEqual([initialValue[0], newBlock])
      }
    })
  })
  it('should not add blocks if the last element is a text block', async () => {
    const initialValue = [
      {
        _key: 'b',
        _type: 'someObject',
      },
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
    ]

    const initialSelection = {
      focus: {path: [{_key: 'b'}], offset: 0},
      anchor: {path: [{_key: 'b'}], offset: 0},
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
        fireEvent.click(element)
        expect(PortableTextEditor.getValue(editor)).toEqual(initialValue)
      }
    })
  })
  it('should not add blocks if the last element is void, but its not focused on that one', async () => {
    const initialValue = [
      {
        _key: 'a',
        _type: 'someObject',
      },
      {
        _type: 'myTestBlockType',
        _key: 'b',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'b1',
            text: '',
            marks: [],
          },
        ],
      },
      {
        _key: 'c',
        _type: 'someObject',
      },
    ]

    const initialSelection = {
      focus: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 2},
      anchor: {path: [{_key: 'b'}, 'children', {_key: 'b1'}], offset: 2},
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
        fireEvent.click(element)
        expect(PortableTextEditor.getValue(editor)).toEqual(initialValue)
      }
    })
  })
  it('should not add blocks if the last element is void, and its focused on that one when clicking', async () => {
    const initialValue = [
      {
        _key: 'a',
        _type: 'someObject',
      },
      {
        _type: 'myTestBlockType',
        _key: 'b',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'b1',
            text: '',
            marks: [],
          },
        ],
      },
      {
        _key: 'c',
        _type: 'someObject',
      },
    ]

    const initialSelection = {
      focus: {path: [{_key: 'c'}], offset: 0},
      anchor: {path: [{_key: 'c'}], offset: 0},
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
        fireEvent.click(element)
        expect(PortableTextEditor.getValue(editor)).toEqual(initialValue.concat(newBlock))
      }
    })
  })
})
