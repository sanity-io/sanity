import React, {ForwardedRef, forwardRef, useCallback, useEffect} from 'react'
import {Schema} from '@sanity/schema'

import {defineArrayMember, defineField} from '@sanity/types'
import {PortableTextEditor, PortableTextEditable} from '../../index'
import type {PortableTextEditorProps, PortableTextEditableProps} from '../../index'

const imageType = defineField({
  type: 'image',
  name: 'blockImage',
})

const someObject = defineField({
  type: 'object',
  name: 'someObject',
  fields: [{type: 'string', name: 'color'}],
})

const blockType = defineField({
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
})

const portableTextType = defineArrayMember({
  type: 'array',
  name: 'body',
  of: [blockType, someObject],
})

const colorAndLink = defineArrayMember({
  type: 'array',
  name: 'colorAndLink',
  of: [
    {
      ...blockType,
      marks: {
        annotations: [
          {
            name: 'link',
            type: 'object',
            fields: [{type: 'string', name: 'color'}],
          },
          {
            name: 'color',
            type: 'object',
            fields: [{type: 'string', name: 'color'}],
          },
        ],
      },
    },
  ],
})

const schema = Schema.compile({
  name: 'test',
  types: [portableTextType, colorAndLink],
})

let key = 0

export const PortableTextEditorTester = forwardRef(function PortableTextEditorTester(
  props: Partial<Omit<PortableTextEditorProps, 'type' | 'onChange' | 'value'>> & {
    schemaType: PortableTextEditorProps['schemaType']
    value?: PortableTextEditorProps['value']
    onChange?: PortableTextEditorProps['onChange']
    selection?: PortableTextEditableProps['selection']
    renderPlaceholder?: PortableTextEditableProps['renderPlaceholder']
  },
  ref: ForwardedRef<PortableTextEditor>,
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
      schemaType={props.schemaType}
      onChange={props.onChange || jest.fn()}
      value={props.value || undefined}
      keyGenerator={_keyGenerator}
      ref={ref}
    >
      <PortableTextEditable
        selection={props.selection || undefined}
        renderPlaceholder={props.renderPlaceholder}
        aria-describedby="desc_foo"
      />
    </PortableTextEditor>
  )
})

export const schemaType = schema.get('body')

export const schemaTypeWithColorAndLink = schema.get('colorAndLink')
