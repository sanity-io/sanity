import {Box, Button} from '@sanity/ui'

import {type Version} from '../types'
import {VersionIcon} from './VersionIcon'

export function VersionBadge(props: {version: Version}): JSX.Element {
  const {version} = props

  return (
    <Box flex="none">
      <Button as="a" mode="bleed" padding={0} radius="full">
        <VersionIcon tone={version.tone} icon={version.icon} padding={2} title={version.title} />
      </Button>
    </Box>
  )
}
