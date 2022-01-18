import React, {ForwardedRef, forwardRef, useCallback, useEffect} from 'react'
import Schema from '@sanity/schema'
import {PortableTextEditor, PortableTextEditorProps} from '../../editor/PortableTextEditor'
import {RawType} from '../../types/schema'
import {PortableTextEditable} from '../../editor/Editable'

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

let key = 0

export const PortableTextEditorTester = forwardRef(function PortableTextEditorTester(
  props: Partial<
    Omit<PortableTextEditorProps, 'type' | 'onChange | value' | 'selection' | 'placeholderText'>
  > & {
    type: PortableTextEditorProps['type']
    value?: PortableTextEditorProps['value']
    onChange?: PortableTextEditorProps['onChange']
    selection?: PortableTextEditorProps['selection']
    renderPlaceholder?: () => React.ReactNode
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
