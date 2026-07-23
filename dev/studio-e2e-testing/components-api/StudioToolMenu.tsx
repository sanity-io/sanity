import {Stack} from '@sanity/ui'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type ToolMenuProps} from 'sanity'

export function StudioToolMenu(props: ToolMenuProps & {testId: string}) {
  const {testId} = props

  // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
  return <Stack data-testid={testId}>{props.renderDefault(props)}</Stack>
}
