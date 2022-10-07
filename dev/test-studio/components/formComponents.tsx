import React from 'react'
import {Card} from '@sanity/ui'
import {createPlugin, InputProps, FieldProps, ItemProps, PreviewProps, DiffProps} from 'sanity'

export function Diff(props: DiffProps) {
  return props.renderDefault(props)

  return (
    <Card
      data-testid="diff-config-component"
      padding={2}
      style={{border: '2px solid magenta'}}
      tone="transparent"
    >
      {props.renderDefault(props)}
    </Card>
  )
}

export function Input(props: InputProps) {
  return (
    <Card data-testid="input-config-component" padding={2} border tone="primary">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Field(props: FieldProps) {
  return (
    <Card data-testid="field-config-component" padding={2} border tone="caution">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Item(props: ItemProps) {
  return (
    <Card data-testid="item-config-component" padding={2} border tone="positive">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Preview(props: PreviewProps) {
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
      diff: (props) => {
        return props.renderDefault(props)

        return (
          <Card data-testid="diff-plugin-component" padding={2} border tone="transparent">
            {props.renderDefault(props)}
          </Card>
        )
      },
      input: (props) => {
        return (
          <Card data-testid="input-plugin-component" padding={2} border tone="primary">
            {props.renderDefault(props)}
          </Card>
        )
      },
      field: (props) => {
        return (
          <Card data-testid="field-plugin-component" padding={2} border tone="caution">
            {props.renderDefault(props)}
          </Card>
        )
      },
      item: (props) => {
        return (
          <Card data-testid="item-plugin-component" padding={2} border tone="positive">
            {props.renderDefault(props)}
          </Card>
        )
      },
      preview: (props) => {
        return (
          <Card data-testid="preview-plugin-component" padding={2} border tone="critical">
            {props.renderDefault(props)}
          </Card>
        )
      },
    },
  },
})
