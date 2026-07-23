import {Stack} from '@sanity/ui'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type InputProps} from 'sanity'

export function FormInput(props: InputProps & {testId: string}) {
  const {testId} = props

  if (props.id === 'root') return props.renderDefault(props)

  // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
  return <Stack data-testid={testId}>{props.renderDefault(props)}</Stack>
}
