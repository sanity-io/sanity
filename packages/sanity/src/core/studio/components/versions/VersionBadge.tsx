import {Box, Button} from '@sanity/ui'

import {type Version} from '../../../../core/util/versions/util'
import {ReleaseIcon} from './ReleaseIcon'

export function VersionBadge(props: {version: Version}): JSX.Element {
  const {version} = props

  return (
    <Box flex="none">
      <Button
        as="a"
        // eslint-disable-next-line no-warning-comments
        // FIXME ONCE THE SWITCH OF VERSIONS
        //href={`/releases/${version.name}`}
        mode="bleed"
        padding={0}
        radius="full"
      >
        <ReleaseIcon hue={version.hue} icon={version.icon} padding={2} title={version.title} />
        {/* <Flex>
                <ReleaseIcon hue={draftRelease.hue} icon={draftRelease.icon} padding={2} />
                <Box padding={2}>
                  <Text size={1}>{draftRelease.title}</Text>
                </Box>
              </Flex> */}
      </Button>
    </Box>
  )
}
