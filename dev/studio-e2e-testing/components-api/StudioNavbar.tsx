import {Stack} from '@sanity/ui'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type NavbarProps} from 'sanity'

export function StudioNavbar(props: NavbarProps & {testId: string}) {
  const {testId} = props

  // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
  return <Stack data-testid={testId}>{props.renderDefault(props)}</Stack>
}
