import {Stack} from '@sanity/ui'
import {FieldProps} from 'sanity'

export function FormField(props: FieldProps & {testId: string}) {
  const {testId} = props

  return <Stack data-testid={testId}>{props.renderDefault(props)}</Stack>
}
