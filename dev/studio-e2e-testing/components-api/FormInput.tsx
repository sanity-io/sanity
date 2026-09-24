import {type InputProps} from 'sanity'
import {VStack} from 'ui5'

export function FormInput(props: InputProps & {testId: string}) {
  const {testId} = props

  if (props.id === 'root') return props.renderDefault(props)

  return <VStack data-testid={testId}>{props.renderDefault(props)}</VStack>
}
