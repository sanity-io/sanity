import {Box} from '@sanity/ui'
import {type LogoProps} from 'sanity'

export function StudioLogo(props: LogoProps & {testId: string}) {
  const {testId} = props

  return <Box data-testid={testId}>{props.renderDefault(props)}</Box>
}
