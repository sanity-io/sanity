import {type ReleaseDocument} from '@sanity/client'
import {Card, Flex, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ReleaseAvatar} from '../../../components'
import {getReleaseTone} from '../../../util/getReleaseTone'
import {ReleaseTime} from '../ReleaseTime'

export function ReleasePreviewCard({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation()
  return (
    <Card border padding={1} radius={2}>
      <Flex gap={3} padding={3}>
        <ReleaseAvatar tone={getReleaseTone(release)} padding={0} />
        <Stack gap={2}>
          <Text weight="medium" size={1}>
            {release.metadata.title || t('release.placeholder-untitled-release')}
          </Text>
          <Text muted size={1}>
            <ReleaseTime release={release} />
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}
