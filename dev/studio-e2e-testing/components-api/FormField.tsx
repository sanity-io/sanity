import {Stack} from '@sanity/ui'
import {FieldProps} from 'sanity'

export function FormField(props: FieldProps) {
  return <Stack data-testid="config-form-field">{props.renderDefault(props)}</Stack>
}
