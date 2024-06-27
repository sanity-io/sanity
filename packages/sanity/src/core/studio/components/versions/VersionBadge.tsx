import {Box, Button} from '@sanity/ui'

import {type Version} from '../../../../core/util/versions/util'
import {ReleaseIcon} from './ReleaseIcon'

export function VersionBadge(props: {version: Version}): JSX.Element {
  const {version} = props

  return (
    <Box flex="none">
      <Button as="a" mode="bleed" padding={0} radius="full">
        <ReleaseIcon hue={version.hue} icon={version.icon} padding={2} title={version.title} />
      </Button>
    </Box>
  )
}
