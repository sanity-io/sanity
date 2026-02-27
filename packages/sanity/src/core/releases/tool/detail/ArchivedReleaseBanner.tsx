import {type ReleaseDocument} from '@sanity/client'
import {InfoOutlineIcon} from '@sanity/icons'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {addDays} from 'date-fns/addDays'
import {format} from 'date-fns/format'
import {useMemo} from 'react'

import {useProjectSubscriptions} from '../../../hooks/useProjectSubscriptions'
import {useTimeZone} from '../../../hooks/useTimeZone'
import {Translate, useTranslation} from '../../../i18n'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {releasesLocaleNamespace} from '../../i18n'

export function ArchivedReleaseBanner({release}: {release: ReleaseDocument}) {
  const {state} = release
  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const {projectSubscriptions} = useProjectSubscriptions()

  const retentionDays = projectSubscriptions?.featureTypes.retention.features[0].attributes
    .maxRetentionDays as number | undefined

  const {utcToCurrentZoneDate} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)
  const removalDate = useMemo(() => {
    if (!retentionDays || !release?._updatedAt) return ''
    const _removalDate = addDays(new Date(release._updatedAt), retentionDays)

    return format(utcToCurrentZoneDate(_removalDate), 'PP')
  }, [retentionDays, release, utcToCurrentZoneDate])

  return (
    <Card padding={4} radius={4} tone="primary" data-testid="retention-policy-card">
      <Flex gap={3}>
        <Text size={1}>
          <InfoOutlineIcon />
        </Text>
        <Stack space={4}>
          <Text size={1} weight="semibold">
            {state === 'archived' ? tRelease('archive-info.title') : tRelease('publish-info.title')}
          </Text>
          {retentionDays && (
            <Text size={1} accent>
              <Translate
                t={tRelease}
                i18nKey="archive-info.description"
                values={{retentionDays, removalDate: removalDate || ''}}
                components={{
                  Link: ({children}) => (
                    <a
                      href="https://www.sanity.io/docs/user-guides/history-experience"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              />
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}
