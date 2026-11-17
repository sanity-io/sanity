import {type ToolMenuProps} from 'sanity'
import {VStack} from 'ui5'

export function StudioToolMenu(props: ToolMenuProps & {testId: string}) {
  const {testId} = props

  return <VStack data-testid={testId}>{props.renderDefault(props)}</VStack>
}
