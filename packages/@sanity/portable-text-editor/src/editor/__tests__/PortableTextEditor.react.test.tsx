/**
 * @jest-environment ./test/setup/jsdom.jest.env.ts
 */
/* eslint-disable no-irregular-whitespace */
// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render} from '@testing-library/react'
import React, {ForwardedRef, forwardRef} from 'react'

import Schema from '@sanity/schema'
import {PortableTextEditor, PortableTextEditorProps} from '../PortableTextEditor'
import {RawType} from '../../types/schema'
import {PortableTextEditable} from '../Editable'
import {PortableTextBlock} from '../../types/portableText'
import {EditorSelection} from '../..'

const imageType: RawType = {
  type: 'image',
  name: 'blockImage',
}

const someObject: RawType = {
  type: 'object',
  name: 'someObject',
  fields: [{type: 'string', name: 'color'}],
}

const blockType: RawType = {
  type: 'block',
  name: 'myTestBlockType',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'H1', value: 'h1'},
    {title: 'H2', value: 'h2'},
    {title: 'H3', value: 'h3'},
    {title: 'H4', value: 'h4'},
    {title: 'H5', value: 'h5'},
    {title: 'H6', value: 'h6'},
    {title: 'Quote', value: 'blockquote'},
  ],
  of: [someObject, imageType],
}

const portableTextType: RawType = {
  type: 'array',
  name: 'body',
  of: [blockType, someObject],
}

const schema = Schema.compile({
  name: 'test',
  types: [portableTextType],
})

const helloBlock: PortableTextBlock = {
  _key: '123',
  _type: 'myTestBlockType',
  markDefs: [],
  children: [{_key: '567', _type: 'span', text: 'Hello', marks: []}],
}

const PortableTextEditorTester = forwardRef(function PortableTextEditorTester(
  props: Partial<
    Omit<PortableTextEditorProps, 'type' | 'onChange | value' | 'selection' | 'placeholderText'>
  > & {
    type: PortableTextEditorProps['type']
    value?: PortableTextEditorProps['value']
    onChange?: PortableTextEditorProps['onChange']
    selection?: PortableTextEditorProps['selection']
    placeholderText?: string
  },
  ref: ForwardedRef<PortableTextEditor>
) {
  return (
    <PortableTextEditor
      type={props.type}
      onChange={props.onChange || jest.fn()}
      value={props.value || undefined}
      ref={ref}
      // keyGenerator={keyGenerator}
      // readOnly={false}
    >
      <PortableTextEditable
        // onBeforeInput={handleOnBeforeInput}
        selection={props.selection || undefined}
        placeholderText={props.placeholderText || 'Type here'}
        // hotkeys={HOTKEYS}
        // renderBlock={renderBlock}
        // renderDecorator={renderDecorator}
        // renderChild={renderChild}
        spellCheck
      />
    </PortableTextEditor>
  )
})

const bodyType = schema.get('body')

describe('initialization', () => {
  it('receives initial onChange events and has custom placeholder text', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const onChange = jest.fn()
    const {container} = render(
      <PortableTextEditorTester
        onChange={onChange}
        placeholderText="Jot something down here"
        ref={editorRef}
        type={bodyType}
        value={undefined}
      />
    )

    expect(editorRef.current).not.toBe(null)
    expect(onChange).toHaveBeenCalledWith({type: 'ready'})
    expect(onChange).toHaveBeenCalledWith({type: 'selection', selection: null})
    expect(onChange).toHaveBeenCalledWith({type: 'value', value: undefined})
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          <div
            class="pt-editable"
            contenteditable="true"
            data-gramm="false"
            data-slate-editor="true"
            data-slate-node="value"
            role="textbox"
            spellcheck="true"
            style="outline: none; white-space: pre-wrap; word-wrap: break-word;"
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
                      data-slate-leaf="true"
                    >
                      <span>
                        <span
                          contenteditable="false"
                          data-slate-placeholder="true"
                          style="pointer-events: none; display: inline-block; width: 0px; max-width: 100%; white-space: nowrap; opacity: 0.333; user-select: none; font-style: normal; font-weight: normal; text-decoration: none;"
                        >
                          Jot something down here
                        </span>
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
    render(<PortableTextEditorTester onChange={onChange} type={bodyType} value={initialValue} />)
    expect(onChange).toHaveBeenCalledWith({type: 'value', value: initialValue})
  })
  it('takes selection from props', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [helloBlock]
    const initialSelection: EditorSelection = {
      anchor: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
      focus: {path: [{_key: '123'}, 'children', {_key: '567'}], offset: 0},
    }
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        selection={initialSelection}
        type={bodyType}
        value={initialValue}
      />
    )
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    PortableTextEditor.focus(editorRef.current)
    expect(PortableTextEditor.getSelection(editorRef.current)).toEqual(initialSelection)
  })
})

describe('normalization', () => {
  it('merges adjacent spans correctly when removing annotations', () => {
    const editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    const initialValue = [
      {
        _key: '5fc57af23597',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'be1c67c6971a',
            _type: 'span',
            marks: [],
            text: 'This is a ',
          },
          {
            _key: '11c8c9f783a8',
            _type: 'span',
            marks: ['fde1fd54b544'],
            text: 'link',
          },
          {
            _key: '576c748e0cd2',
            _type: 'span',
            marks: [],
            text: ', this is ',
          },
          {
            _key: 'f3d73d3833bf',
            _type: 'span',
            marks: ['7b6d3d5de30c'],
            text: 'another',
          },
          {
            _key: '73b01f13c2ec',
            _type: 'span',
            marks: [],
            text: ', and this is ',
          },
          {
            _key: '13eb0d467c82',
            _type: 'span',
            marks: ['93a1d24eade0'],
            text: 'a third',
          },
        ],
        markDefs: [
          {
            _key: 'fde1fd54b544',
            _type: 'link',
            url: '1',
          },
          {
            _key: '7b6d3d5de30c',
            _type: 'link',
            url: '2',
          },
          {
            _key: '93a1d24eade0',
            _type: 'link',
            url: '3',
          },
        ],
        style: 'normal',
      },
    ]
    const onChange = jest.fn()
    render(
      <PortableTextEditorTester
        onChange={onChange}
        ref={editorRef}
        type={bodyType}
        value={initialValue}
      />
    )
    if (!editorRef.current) {
      throw new Error('No editor')
    }
    PortableTextEditor.focus(editorRef.current)
    PortableTextEditor.select(editorRef.current, {
      focus: {path: [{_key: '5fc57af23597'}, 'children', {_key: '11c8c9f783a8'}], offset: 4},
      anchor: {path: [{_key: '5fc57af23597'}, 'children', {_key: '11c8c9f783a8'}], offset: 0},
    })
    const linkType = PortableTextEditor.getPortableTextFeatures(editorRef.current).annotations.find(
      (a) => a.type.name === 'link'
    )?.type
    if (!linkType) {
      throw new Error('No link type found')
    }
    PortableTextEditor.removeAnnotation(editorRef.current, linkType)
    expect(PortableTextEditor.getValue(editorRef.current)).toEqual([
      {
        _key: '5fc57af23597',
        _type: 'myTestBlockType',
        children: [
          {
            _key: 'be1c67c6971a',
            _type: 'span',
            marks: [],
            text: 'This is a link, this is ',
          },
          {
            _key: 'f3d73d3833bf',
            _type: 'span',
            marks: ['7b6d3d5de30c'],
            text: 'another',
          },
          {
            _key: '73b01f13c2ec',
            _type: 'span',
            marks: [],
            text: ', and this is ',
          },
          {
            _key: '13eb0d467c82',
            _type: 'span',
            marks: ['93a1d24eade0'],
            text: 'a third',
          },
        ],
        markDefs: [
          {
            _key: '7b6d3d5de30c',
            _type: 'link',
            url: '2',
          },
          {
            _key: '93a1d24eade0',
            _type: 'link',
            url: '3',
          },
        ],
        style: 'normal',
      },
    ])
  })
})
