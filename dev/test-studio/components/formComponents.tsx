import React, {useState} from 'react'
import {Card, Stack, Button, Text} from '@sanity/ui'
import {definePlugin, InputProps, FieldProps, ItemProps, Preview} from 'sanity'

export function Input(props: InputProps) {
  const [count, setCount] = useState(0)

  return (
    <Card data-testid="input-config-component" padding={2} border tone="primary">
      <Stack space={2}>
        <Button onClick={() => setCount((c) => c + 1)} text={`Re-render: ${count}`} />{' '}
        <Text>Default - no skip</Text>
        <Preview
          key={`default-no-${count.toString()}`}
          layout="default"
          value={props.value}
          schemaType={props.schemaType}
        />
        <Text>Default - with skip</Text>
        <Preview
          key={`default-${count.toString()}`}
          layout="default"
          value={props.value}
          schemaType={props.schemaType}
          __internal_skip_visibility_check
        />
        <Text>No Layout - no skip</Text>
        <Preview
          key={`no-layout-no-${count.toString()}`}
          value={props.value}
          schemaType={props.schemaType}
        />
        <Text>No Layout - with skip</Text>
        <Preview
          key={`no-layout-${count.toString()}`}
          value={props.value}
          schemaType={props.schemaType}
          __internal_skip_visibility_check
        />
        <Text>Block</Text>
        <Preview
          key={`block-${count.toString()}`}
          layout="block"
          value={props.value}
          schemaType={props.schemaType}
        />
        <Text>Block Image</Text>
        <Preview
          key={`blockImage-${count.toString()}`}
          layout="blockImage"
          value={props.value}
          schemaType={props.schemaType}
        />
        <Text>inline</Text>
        <Preview
          key={`inline-${count.toString()}`}
          layout="inline"
          value={props.value}
          schemaType={props.schemaType}
        />
      </Stack>
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

export const formComponentsPlugin = definePlugin({
  name: 'form-components-plugin',
  form: {
    components: {
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
