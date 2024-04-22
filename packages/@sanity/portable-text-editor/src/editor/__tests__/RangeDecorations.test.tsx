import {describe, expect, it, jest} from '@jest/globals'
/* eslint-disable no-irregular-whitespace */
import {type PortableTextBlock} from '@sanity/types'
import {render, waitFor} from '@testing-library/react'
import {createRef, type ReactNode, type RefObject} from 'react'

import {type RangeDecoration} from '../..'
import {type PortableTextEditor} from '../PortableTextEditor'
import {PortableTextEditorTester, schemaType} from './PortableTextEditorTester'

const helloBlock: PortableTextBlock = {
  _key: '123',
  _type: 'myTestBlockType',
  markDefs: [],
  children: [{_key: '567', _type: 'span', text: 'Hello', marks: []}],
}

let rangeDecorationIteration = 0

const RangeDecorationTestComponent = ({children}: {children?: ReactNode}) => {
  rangeDecorationIteration++
  return <span data-testid="range-decoration">{children}</span>
}

describe('RangeDecorations', () => {
  it.only('only render range decorations as necessary', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    const value = [helloBlock]
    let rangeDecorations: RangeDecoration[] = [
      {
        component: RangeDecorationTestComponent,
        selection: {
          anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
          focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
        },
      },
    ]
    const {rerender} = render(
      <PortableTextEditorTester
        onChange={onChange}
        rangeDecorations={rangeDecorations}
        ref={editorRef}
        schemaType={schemaType}
        value={value}
      />,
    )
    await waitFor(() => {
      expect([rangeDecorationIteration, 'initial']).toEqual([0, 'initial'])
    })
    // Re-render with the same range decorations
    rerender(
      <PortableTextEditorTester
        onChange={onChange}
        rangeDecorations={rangeDecorations}
        ref={editorRef}
        schemaType={schemaType}
        value={value}
      />,
    )
    await waitFor(() => {
      expect([rangeDecorationIteration, 'initial']).toEqual([0, 'initial'])
    })
    // Update the range decorations, a new object with identical values
    rangeDecorations = [
      {
        component: RangeDecorationTestComponent,
        selection: {
          anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
          focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
        },
      },
    ]
    rerender(
      <PortableTextEditorTester
        onChange={onChange}
        rangeDecorations={rangeDecorations}
        ref={editorRef}
        schemaType={schemaType}
        value={value}
      />,
    )
    await waitFor(() => {
      expect([rangeDecorationIteration, 'updated-with-equal-values']).toEqual([
        0,
        'updated-with-equal-values',
      ])
    })
    // Update the range decorations with a new offset
    rangeDecorations = [
      {
        component: RangeDecorationTestComponent,
        selection: {
          anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
          focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 4},
        },
      },
    ]
    rerender(
      <PortableTextEditorTester
        onChange={onChange}
        rangeDecorations={rangeDecorations}
        ref={editorRef}
        schemaType={schemaType}
        value={value}
      />,
    )
    await waitFor(() => {
      expect([rangeDecorationIteration, 'updated-with-different']).toEqual([
        1,
        'updated-with-different',
      ])
    })
  })
})
