import React, {ForwardedRef, forwardRef, useCallback, useEffect} from 'react'
import Schema from '@sanity/schema'

import {PortableTextEditor, PortableTextEditable} from '../../index'
import type {PortableTextEditorProps, PortableTextEditableProps} from '../../index'

const imageType = {
  type: 'image',
  name: 'blockImage',
}

const someObject = {
  type: 'object',
  name: 'someObject',
  fields: [{type: 'string', name: 'color'}],
}

const blockType = {
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

const portableTextType = {
  type: 'array',
  name: 'body',
  of: [blockType, someObject],
}

const schema = Schema.compile({
  name: 'test',
  types: [portableTextType],
})

let key = 0

export const PortableTextEditorTester = forwardRef(function PortableTextEditorTester(
  props: Partial<Omit<PortableTextEditorProps, 'type' | 'onChange' | 'value'>> & {
    type: PortableTextEditorProps['type']
    value?: PortableTextEditorProps['value']
    onChange?: PortableTextEditorProps['onChange']
    selection?: PortableTextEditableProps['selection']
    renderPlaceholder?: PortableTextEditableProps['renderPlaceholder']
  },
  ref: ForwardedRef<PortableTextEditor>
) {
  useEffect(() => {
    key = 0
  })
  const _keyGenerator = useCallback(() => {
    key++
    return `${key}`
  }, [])
  return (
    <PortableTextEditor
      type={props.type}
      onChange={props.onChange || jest.fn()}
      value={props.value || undefined}
      keyGenerator={_keyGenerator}
      ref={ref}
    >
      <PortableTextEditable
        selection={props.selection || undefined}
        renderPlaceholder={props.renderPlaceholder}
      />
    </PortableTextEditor>
  )
})

export const type = schema.get('body')
