import {Card} from '@sanity/ui'
import {
  type BlockAnnotationProps,
  type BlockProps,
  definePlugin,
  type FieldProps,
  type InputProps,
  type ItemProps,
  type PreviewProps,
} from 'sanity'

export function Input(props: InputProps) : React.JSX.Element {
  return (
    <Card data-testid="input-config-component" padding={2} border tone="primary">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Field(props: FieldProps) : React.JSX.Element {
  return (
    <Card data-testid="field-config-component" padding={2} border tone="caution">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Item(props: ItemProps) : React.JSX.Element {
  return (
    <Card data-testid="item-config-component" padding={2} border tone="positive">
      {props.renderDefault(props)}
    </Card>
  )
}

export function Block(props: BlockProps) : React.JSX.Element {
  return (
    <Card data-testid="block-config-component" padding={2} border tone="positive">
      {props.renderDefault(props)}
    </Card>
  )
}

export function InlineBlock(props: BlockProps) : React.JSX.Element {
  return (
    <Card
      data-testid="inline-block-config-component"
      padding={2}
      border
      tone="positive"
      display="inline-block"
    >
      {props.renderDefault(props)}
    </Card>
  )
}

export function Annotation(props: BlockAnnotationProps) : React.JSX.Element {
  return (
    <Card
      data-testid="annotation-config-component"
      padding={2}
      border
      tone="positive"
      display="inline-block"
    >
      {props.renderDefault(props)}
    </Card>
  )
}

export function Preview(props: PreviewProps) : React.JSX.Element {
  return (
    <Card data-testid="preview-config-component" padding={2} border tone="critical">
      {props.renderDefault(props)}
    </Card>
  )
}

export function CustomBadge() : React.JSX.Element {
  return {
    label: 'Hello world',
    title: 'Hello I am a custom document badge',
  }
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
      annotation: (props) => {
        return (
          <Card
            as="span"
            data-testid="annotation-plugin-component"
            padding={2}
            tone="critical"
            style={{display: 'inline'}}
          >
            {props.renderDefault(props)}
          </Card>
        )
      },
      block: (props) => {
        return (
          <Card data-testid="block-plugin-component" padding={2} tone="positive">
            {props.renderDefault(props)}
          </Card>
        )
      },
      inlineBlock: (props) => {
        return (
          <Card data-testid="inline-block-plugin-component" padding={2} tone="positive">
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
