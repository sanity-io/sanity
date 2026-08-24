import {type LogoProps} from 'sanity'
import {Box} from 'ui5'

export function StudioLogo(props: LogoProps & {testId: string}) {
  const {testId} = props

  return <Box data-testid={testId}>{props.renderDefault(props)}</Box>
}
