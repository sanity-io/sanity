import {Stack} from '@sanity/ui'
import {InputProps} from 'sanity'

export function FormInput(props: InputProps) {
  if (props.id === 'root') return props.renderDefault(props)

  return <Stack data-testid="config-form-input">{props.renderDefault(props)}</Stack>
}
