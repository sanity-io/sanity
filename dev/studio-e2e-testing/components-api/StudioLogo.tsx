import {Box} from '@sanity/ui'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type LogoProps} from 'sanity'

export function StudioLogo(props: LogoProps & {testId: string}) {
  const {testId} = props

  // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
  return <Box data-testid={testId}>{props.renderDefault(props)}</Box>
}
