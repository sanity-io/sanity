import {Box, Text} from '@sanity/ui'

import {type LogoProps} from '../../../config/studio'

/**
 * @hidden
 * @beta */
export function StudioLogo(props: LogoProps) {
  const {title} = props

  return (
    <Box padding={3} data-testid="studio-logo">
      <Text weight="medium">{title}</Text>
    </Box>
  )
}
