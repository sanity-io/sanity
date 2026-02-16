import {type ReleaseDocument} from '@sanity/client'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'

import {Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ReleaseAvatar} from '../../../components'
import {getReleaseTitleDetails} from '../../../util/getReleaseTitleDetails'
import {getReleaseTone} from '../../../util/getReleaseTone'
import {ReleaseTime} from '../ReleaseTime'

export function ReleasePreviewCard({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation()
  const titleDetails = getReleaseTitleDetails(
    release.metadata.title,
    t('release.placeholder-untitled-release'),
  )

  return (
    <Card border padding={1} radius={2}>
      <Flex gap={3} padding={3}>
        <ReleaseAvatar tone={getReleaseTone(release)} padding={0} />
        <Stack space={2}>
          <Tooltip
            disabled={!titleDetails.isTruncated}
            content={
              <Box style={{maxWidth: '300px'}}>
                <Text size={1}>{titleDetails.fullTitle}</Text>
              </Box>
            }
          >
            <Text weight="medium" size={1}>
              {titleDetails.displayTitle}
            </Text>
          </Tooltip>
          <Text muted size={1}>
            <ReleaseTime release={release} />
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}
