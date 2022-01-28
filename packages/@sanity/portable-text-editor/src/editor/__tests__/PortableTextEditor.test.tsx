/**
 * @jest-environment ./test/setup/jsdom.jest.env.ts
 */
/* eslint-disable no-irregular-whitespace */
// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import {act} from 'react-dom/test-utils'
import {render} from '@testing-library/react'
import {PortableTextEditor} from '../PortableTextEditor'
import {EditorSelection, PortableTextBlock} from '../..'
import {PortableTextEditorTester, type} from './PortableTextEditorTester'

const helloBlock: PortableTextBlock = {
  _key: '123',
  _type: 'myTestBlockType',
  markDefs: [],
  children: [{_key: '567', _type: 'span', text: 'Hello', marks: []}],
}

describe('initialization', () => {
  it('receives initial onChange events and has custom placeholder', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    const {container} = render(
      <PortableTextEditorTester
        onChange={onChange}
        renderPlaceholder={() => 'Jot something down here'}
        ref={editorRef}
        type={type}
        value={undefined}
      />
    )

    expect(editorRef.current).not.toBe(null)
    expect(onChange).toHaveBeenCalledWith({type: 'ready'})
    expect(onChange).toHaveBeenCalledWith({type: 'value', value: undefined})
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          <div
            autocapitalize="false"
            autocorrect="false"
            class="pt-editable"
            contenteditable="true"
            data-slate-editor="true"
            data-slate-node="value"
            role="textbox"
            spellcheck="false"
            style="position: relative; outline: none; white-space: pre-wrap; word-wrap: break-word;"
            zindex="-1"
          >
            <div
              class="pt-block pt-text-block pt-text-block-style-normal"
              data-slate-node="element"
            >
              <div
                draggable="false"
              >
                <div>
                  <span
                    data-slate-node="text"
                  >
                    <div
                      contenteditable="false"
                      style="opacity: 0.5; position: absolute; user-select: none; pointer-events: none;"
                    >
                      Jot something down here
                    </div>
                    <span
                      data-slate-leaf="true"
                    >
                      <span
                        draggable="false"
                      >
                        <span
                          data-slate-length="0"
                          data-slate-zero-width="n"
                        >
                          ﻿
                          <br />
                        </span>
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)
  })
  it('takes value from props', () => {
    const initialValue = [helloBlock]
    const onChange = jest.fn()
    render(<PortableTextEditorTester onChange={onChange} type={type} value={initialValue} />)
    expect(onChange).toHaveBeenCalledWith({type: 'value', value: initialValue})
  })
  it('takes initial selection from props', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [helloBlock]
    const initialSelection: EditorSelection = {
      anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
      focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
    }
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        selection={initialSelection}
        type={type}
        value={initialValue}
      />
    )
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    act(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    })
    expect(PortableTextEditor.getSelection(editorRef.current)).toEqual(initialSelection)
  })

  it('updates editor selection from new prop and keeps object equality in editor.getSelection()', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [helloBlock]
    const initialSelection: EditorSelection = {
      anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
      focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
    }
    const newSelection: EditorSelection = {
      anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
      focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 3},
    }
    const onChange = jest.fn()
    const {rerender} = render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        selection={initialSelection}
        type={type}
        value={initialValue}
      />
    )
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    act(() => {
      if (editorRef.current) {
        const sel = PortableTextEditor.getSelection(editorRef.current)
        PortableTextEditor.focus(editorRef.current)

        // Test for object equality here!
        const anotherSel = PortableTextEditor.getSelection(editorRef.current)
        expect(PortableTextEditor.getSelection(editorRef.current)).toStrictEqual(initialSelection)
        expect(sel).toBe(anotherSel)
      }
    })
    rerender(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        selection={newSelection}
        type={type}
        value={initialValue}
      />
    )
    act(() => {
      if (editorRef.current) {
        expect(PortableTextEditor.getSelection(editorRef.current)).toEqual(newSelection)
      }
    })
  })
})
