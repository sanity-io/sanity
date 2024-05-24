import {describe, expect, it, jest} from '@jest/globals'
/* eslint-disable no-irregular-whitespace */
import {type PortableTextBlock} from '@sanity/types'
import {render, waitFor} from '@testing-library/react'
import {createRef, type RefObject} from 'react'

import {type EditorSelection} from '../..'
import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextEditorTester, schemaType} from './PortableTextEditorTester'

const helloBlock: PortableTextBlock = {
  _key: '123',
  _type: 'myTestBlockType',
  markDefs: [],
  children: [{_key: '567', _type: 'span', text: 'Hello', marks: []}],
}

const renderPlaceholder = () => 'Jot something down here'

describe('initialization', () => {
  it('receives initial onChange events and has custom placeholder', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const onChange = jest.fn()
    const {container} = render(
      <PortableTextEditorTester
        onChange={onChange}
        renderPlaceholder={renderPlaceholder}
        ref={editorRef}
        schemaType={schemaType}
        value={undefined}
      />,
    )

    await waitFor(() => {
      expect(editorRef.current).not.toBe(null)
      expect(onChange).toHaveBeenCalledWith({type: 'ready'})
      expect(onChange).toHaveBeenCalledWith({type: 'value', value: undefined})
      expect(container).toMatchInlineSnapshot(`
<div>
  <div
    aria-describedby="desc_foo"
    aria-multiline="true"
    autocapitalize="false"
    autocorrect="false"
    class="pt-editable"
    contenteditable="true"
    data-slate-editor="true"
    data-slate-node="value"
    role="textbox"
    spellcheck="false"
    style="position: relative; white-space: pre-wrap; word-wrap: break-word;"
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
            <span
              contenteditable="false"
              style="position: absolute; user-select: none; pointer-events: none; left: 0px; right: 0px;"
            >
              Jot something down here
            </span>
            <span
              data-slate-leaf="true"
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
        </div>
      </div>
    </div>
  </div>
</div>
`)
    })
  })
  it('takes value from props and confirms it by emitting value change event', async () => {
    const initialValue = [helloBlock]
    const onChange = jest.fn()
    const editorRef = createRef<PortableTextEditor>()
    render(
      <PortableTextEditorTester
        ref={editorRef}
        onChange={onChange}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    const normalizedEditorValue = [{...initialValue[0], style: 'normal'}]
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({type: 'value', value: initialValue})
    })
    if (editorRef.current) {
      expect(PortableTextEditor.getValue(editorRef.current)).toStrictEqual(normalizedEditorValue)
    }
  })

  it('takes initial selection from props', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const initialValue = [helloBlock]
    const initialSelection: EditorSelection = {
      anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
      focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
      backward: false,
    }
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        selection={initialSelection}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    await waitFor(() => {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
        expect(PortableTextEditor.getSelection(editorRef.current)).toStrictEqual(initialSelection)
      }
    })
  })

  it('updates editor selection from new prop and keeps object equality in editor.getSelection()', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const initialValue = [helloBlock]
    const initialSelection: EditorSelection = {
      anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
      focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
      backward: false,
    }
    const newSelection: EditorSelection = {
      anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
      focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 3},
      backward: false,
    }
    const onChange = jest.fn()
    const {rerender} = render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        selection={initialSelection}
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    await waitFor(() => {
      if (editorRef.current) {
        expect(onChange).toHaveBeenCalledWith({type: 'ready'})
        expect(onChange).toHaveBeenCalledWith({type: 'value', value: initialValue})
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
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    waitFor(() => {
      if (editorRef.current) {
        expect(PortableTextEditor.getSelection(editorRef.current)).toEqual(newSelection)
      }
    })
  })

  it('handles empty array value', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const initialValue: PortableTextBlock[] = []
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
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    await waitFor(() => {
      if (editorRef.current) {
        expect(onChange).not.toHaveBeenCalledWith({
          type: 'invalidValue',
          value: initialValue,
          resolution: {
            action: 'Unset the value',
            description: 'Editor value must be an array of Portable Text blocks, or undefined.',
            item: initialValue,
            patches: [
              {
                path: [],
                type: 'unset',
              },
            ],
          },
        })
        expect(onChange).toHaveBeenCalledWith({type: 'value', value: initialValue})
        expect(onChange).toHaveBeenCalledWith({type: 'ready'})
      }
    })
  })
  it('validates a non-initial value', async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    let value: PortableTextBlock[] = [helloBlock]
    const initialSelection: EditorSelection = {
      anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
      focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 2},
    }
    const onChange = jest.fn()
    let _rerender: any
    await waitFor(() => {
      render(
        <PortableTextEditorTester
          onChange={onChange}
          ref={editorRef}
          selection={initialSelection}
          schemaType={schemaType}
          value={value}
        />,
      )
      _rerender = render
    })
    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalledWith({
        type: 'invalidValue',
        value,
        resolution: {
          action: 'Unset the value',
          description: 'Editor value must be an array of Portable Text blocks, or undefined.',
          item: value,
          patches: [
            {
              path: [],
              type: 'unset',
            },
          ],
        },
      })
      expect(onChange).toHaveBeenCalledWith({type: 'value', value})
    })
    value = [{_type: 'banana', _key: '123'}]
    const newOnChange = jest.fn()
    _rerender(
      <PortableTextEditorTester
        onChange={newOnChange}
        ref={editorRef}
        selection={initialSelection}
        schemaType={schemaType}
        value={value}
      />,
    )
    await waitFor(() => {
      expect(newOnChange).toHaveBeenCalledWith({
        type: 'invalidValue',
        value,
        resolution: {
          action: 'Remove the block',
          description: "Block with _key '123' has invalid _type 'banana'",
          item: value[0],
          patches: [
            {
              path: [{_key: '123'}],
              type: 'unset',
            },
          ],
          i18n: {
            action: 'inputs.portable-text.invalid-value.disallowed-type.action',
            description: 'inputs.portable-text.invalid-value.disallowed-type.description',
            values: {
              key: '123',
              typeName: 'banana',
            },
          },
        },
      })
    })
  })
  it("doesn't crash when containing a invalid block somewhere inside the content", async () => {
    const editorRef: RefObject<PortableTextEditor> = createRef()
    const initialValue: PortableTextBlock[] = [
      helloBlock,
      {
        _key: 'abc',
        _type: 'myTestBlockType',
        markDefs: [],
        children: [{_key: 'def', _type: 'span', marks: []}],
      },
    ]
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
        schemaType={schemaType}
        value={initialValue}
      />,
    )
    await waitFor(() => {
      if (editorRef.current) {
        expect(onChange).toHaveBeenCalledWith({
          type: 'invalidValue',
          value: initialValue,
          resolution: {
            action: 'Write an empty text property to the object',
            description:
              "Child with _key 'def' in block with key 'abc' has missing or invalid text property!",
            i18n: {
              action: 'inputs.portable-text.invalid-value.invalid-span-text.action',
              description: 'inputs.portable-text.invalid-value.invalid-span-text.description',
              values: {
                key: 'abc',
                childKey: 'def',
              },
            },
            item: {
              _key: 'abc',
              _type: 'myTestBlockType',
              children: [
                {
                  _key: 'def',
                  _type: 'span',
                  marks: [],
                },
              ],
              markDefs: [],
            },
            patches: [
              {
                path: [
                  {
                    _key: 'abc',
                  },
                  'children',
                  {
                    _key: 'def',
                  },
                ],
                type: 'set',
                value: {
                  _key: 'def',
                  _type: 'span',
                  marks: [],
                  text: '',
                },
              },
            ],
          },
        })
      }
    })
    expect(onChange).not.toHaveBeenCalledWith({type: 'value', value: initialValue})
    expect(onChange).toHaveBeenCalledWith({type: 'ready'})
  })
})
