import {Card, Flex, Stack, Text} from '@sanity/ui'

import {ReleaseAvatar} from '../../../components'
import {type ReleaseDocument} from '../../../store/types'
import {getReleaseTone} from '../../../util/getReleaseTone'
import {ReleaseTime} from '../ReleaseTime'

export function ReleasePreviewCard({release}: {release: ReleaseDocument}) {
  return (
    <Card border padding={1} radius={2}>
      <Flex gap={3} padding={3}>
        <ReleaseAvatar tone={getReleaseTone(release)} padding={0} />
        <Stack space={2}>
          <Text weight="medium" size={1}>
            {release.metadata.title}
          </Text>
          <Text muted size={1}>
            <ReleaseTime release={release} />
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}
