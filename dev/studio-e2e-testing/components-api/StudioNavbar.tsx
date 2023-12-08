import {Stack} from '@sanity/ui'
import {NavbarProps} from 'sanity'

export function StudioNavbar(props: NavbarProps & {testId: string}) {
  const {testId} = props

  return <Stack data-testid={testId}>{props.renderDefault(props)}</Stack>
}
