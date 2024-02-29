import {describe, expect, it, jest} from '@jest/globals'
import {type PortableTextBlock} from '@sanity/types'
import {render, waitFor} from '@testing-library/react'
import {createRef, type RefObject} from 'react'

import {PortableTextEditorTester, schemaType} from '../../__tests__/PortableTextEditorTester'
import {PortableTextEditor} from '../../PortableTextEditor'

const INITIAL_VALUE: PortableTextBlock[] = [
  {
    _key: 'a',
    _type: 'myTestBlockType',
    children: [
      {
        _key: 'a1',
        _type: 'span',
        marks: [],
        text: 'This is some text in the block',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
]

describe('plugin:withEditableAPI: .isSelectionsOverlapping', () => {
  it('returns true if the selections are partially overlapping', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={INITIAL_VALUE}
      />,
    )
    const selectionA = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 4},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 8},
    }

    const selectionB = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 2},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 6},
    }

    await waitFor(() => {
      if (editorRef.current) {
        const isOverlapping = PortableTextEditor.isSelectionsOverlapping(
          editorRef.current,
          selectionA,
          selectionB,
        )

        expect(isOverlapping).toBe(true)
      }
    })
  })

  it('returns true if the selections are fully overlapping', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={INITIAL_VALUE}
      />,
    )
    const selectionA = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 4},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 8},
    }

    const selectionB = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 4},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 8},
    }

    await waitFor(() => {
      if (editorRef.current) {
        const isOverlapping = PortableTextEditor.isSelectionsOverlapping(
          editorRef.current,
          selectionA,
          selectionB,
        )

        expect(isOverlapping).toBe(true)
      }
    })
  })

  it('return true if selection is fully inside another selection', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={INITIAL_VALUE}
      />,
    )
    const selectionA = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 2},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 10},
    }

    const selectionB = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 4},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 6},
    }

    await waitFor(() => {
      if (editorRef.current) {
        const isOverlapping = PortableTextEditor.isSelectionsOverlapping(
          editorRef.current,
          selectionA,
          selectionB,
        )

        expect(isOverlapping).toBe(true)
      }
    })
  })

  it('returns false if the selections are not overlapping', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        schemaType={schemaType}
        value={INITIAL_VALUE}
      />,
    )
    const selectionA = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 4},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 8},
    }

    const selectionB = {
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 10},
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 12},
    }

    await waitFor(() => {
      if (editorRef.current) {
        const isOverlapping = PortableTextEditor.isSelectionsOverlapping(
          editorRef.current,
          selectionA,
          selectionB,
        )

        expect(isOverlapping).toBe(false)
      }
    })
  })
})
