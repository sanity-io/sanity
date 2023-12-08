import {Stack} from '@sanity/ui'
import {InputProps} from 'sanity'

export function FormInput(props: InputProps & {testId: string}) {
  const {testId} = props

  if (props.id === 'root') return props.renderDefault(props)

  return <Stack data-testid={testId}>{props.renderDefault(props)}</Stack>
}
