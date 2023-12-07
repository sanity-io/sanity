import {Stack} from '@sanity/ui'
import {NavbarProps} from 'sanity'

export function StudioNavbar(props: NavbarProps) {
  return <Stack data-testid="config-studio-navbar">{props.renderDefault(props)}</Stack>
}
