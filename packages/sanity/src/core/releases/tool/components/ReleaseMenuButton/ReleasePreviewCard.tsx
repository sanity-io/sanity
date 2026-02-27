import {type ReleaseDocument} from '@sanity/client'
import {Card, Flex, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ReleaseAvatar, ReleaseTitle} from '../../../components'
import {ReleaseTime} from '../ReleaseTime'

export function ReleasePreviewCard({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation()

  return (
    <Card border padding={1} radius={2}>
      <Flex gap={3} padding={3}>
        <ReleaseAvatar release={release} padding={0} />
        <Stack space={2}>
          <ReleaseTitle
            title={release.metadata.title}
            fallback={t('release.placeholder-untitled-release')}
            textProps={{weight: 'medium', size: 1}}
          />
          <Text muted size={1}>
            <ReleaseTime release={release} />
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}
