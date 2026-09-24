import {type FieldProps} from 'sanity'
import {VStack} from 'ui5'

export function FormField(props: FieldProps & {testId: string}) {
  const {testId} = props

  return <VStack data-testid={testId}>{props.renderDefault(props)}</VStack>
}
