import {Stack} from '@sanity/ui'
import {ToolMenuProps} from 'sanity'

export function StudioToolMenu(props: ToolMenuProps & {testId: string}) {
  const {testId} = props

  return <Stack data-testid={testId}>{props.renderDefault(props)}</Stack>
}
