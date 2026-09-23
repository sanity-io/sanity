import {type ReleaseDocument} from '@sanity/client'
import {Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ReleaseAvatar} from '../../../components/ReleaseAvatar'
import {ReleaseTitle} from '../../../components/ReleaseTitle'
import {ReleaseTime} from '../ReleaseTime'

export function ReleasePreviewCard({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation()

  return (
    <Card border padding={1} radius={2}>
      <Flex gap={3} padding={3}>
        <ReleaseAvatar release={release} padding={0} />
        <VStack gap={2}>
          <ReleaseTitle
            title={release.metadata.title}
            fallback={t('release.placeholder-untitled-release')}
            textProps={{weight: 'medium', size: 1}}
          />
          <Text muted size={1}>
            <ReleaseTime release={release} />
          </Text>
        </VStack>
      </Flex>
    </Card>
  )
}
