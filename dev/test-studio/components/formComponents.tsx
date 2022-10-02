import React from 'react'
import {Card} from '@sanity/ui'
import {createPlugin, InputProps, FieldProps, ItemProps, PreviewProps} from 'sanity'

export function Input(props: InputProps) {
  if (props.schemaType.title !== 'v3 form components') {
    return props.renderDefault(props)
  }

  return (
    <Card data-testid="input-config-component" padding={2} border tone="primary">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Field(props: FieldProps) {
  if (props.schemaType.title !== 'v3 form components') {
    return props.renderDefault(props)
  }

  return (
    <Card data-testid="field-config-component" padding={2} border tone="caution">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Item(props: ItemProps) {
  if (props.schemaType.title !== 'v3 form components') {
    return props.renderDefault(props)
  }

  return (
    <Card data-testid="item-config-component" padding={2} border tone="positive">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Preview(props: PreviewProps) {
  if (props?.schemaType?.title !== 'v3 form components') {
    return props.renderDefault(props)
  }

  return (
    <Card data-testid="preview-config-component" padding={2} border tone="critical">
      {props.renderDefault(props)}
    </Card>
  )
}

export const formComponentsPlugin = createPlugin({
  name: 'form-components-plugin',
  form: {
    components: {
      input: (props) => {
        if (props.schemaType.title !== 'v3 form components') {
          return props.renderDefault(props)
        }
        return (
          <Card data-testid="input-plugin-component" padding={2} border tone="primary">
            {props.renderDefault(props)}
          </Card>
        )
      },
      field: (props) => {
        if (props.schemaType.title !== 'v3 form components') {
          return props.renderDefault(props)
        }
        return (
          <Card data-testid="field-plugin-component" padding={2} border tone="caution">
            {props.renderDefault(props)}
          </Card>
        )
      },
      item: (props) => {
        if (props.schemaType.title !== 'v3 form components') {
          return props.renderDefault(props)
        }
        return (
          <Card data-testid="item-plugin-component" padding={2} border tone="positive">
            {props.renderDefault(props)}
          </Card>
        )
      },
      preview: (props) => {
        if (props?.schemaType?.title !== 'v3 form components') {
          return props.renderDefault(props)
        }
        return (
          <Card data-testid="preview-plugin-component" padding={2} border tone="critical">
            {props.renderDefault(props)}
          </Card>
        )
      },
    },
  },
})
