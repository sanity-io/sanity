import {Text, Box} from 'ui5'

import {type LogoProps} from '../../../config/studio/types'

/**
 * @hidden
 * @beta */
export function StudioLogo(props: LogoProps) {
  const {title} = props

  return (
    <Box padding={3} data-testid="studio-logo">
      <Text weight="medium" as="div" trim={true}>
        {title}
      </Text>
    </Box>
  )
}
