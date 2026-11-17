import {type NavbarProps} from 'sanity'
import {VStack} from 'ui5'

export function StudioNavbar(props: NavbarProps & {testId: string}) {
  const {testId} = props

  return <VStack data-testid={testId}>{props.renderDefault(props)}</VStack>
}
