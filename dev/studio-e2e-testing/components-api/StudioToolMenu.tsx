import {Stack} from '@sanity/ui'
import {ToolMenuProps} from 'sanity'

export function StudioToolMenu(props: ToolMenuProps) {
  return <Stack data-testid="config-studio-tool-menu">{props.renderDefault(props)}</Stack>
}
