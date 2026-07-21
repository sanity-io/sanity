import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {type CSSProperties, useEffect, useRef, useState} from 'react'

import {Details} from '../../../form/components/Details'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {isNotArchivedRelease} from '../../util/util'
import {ArchivedReleaseBanner} from './ArchivedReleaseBanner'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'
import {ReleaseTypePicker} from './ReleaseTypePicker'
import {type DocumentInRelease} from './types'
import {ValidationProgressIndicator} from './ValidationProgressIndicator'

// Each metadata row is the same fixed height so the three key/value pairs sit on an even rhythm —
// otherwise the Schedule row (which holds the taller type-picker button) spaces itself further from
// Status than Status is from Documents.
const METADATA_ROW_STYLE: CSSProperties = {minHeight: 31}

export function ReleaseDashboardDetails({
  release,
  documents,
}: {
  release: ReleaseDocument
  documents: DocumentInRelease[]
}) {
  const {state} = release

  const {checkWithPermissionGuard} = useReleasePermissions()
  const {publishRelease, schedule} = useReleaseOperations()

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const isAtTimeRelease = release?.metadata?.releaseType === 'scheduled'
  const isReleaseOpen = state !== 'archived' && state !== 'published'
  const isActive = release.state === 'active'
  const shouldDisplayError = isActive && typeof release.error !== 'undefined'
  const [shouldDisplayPermissionWarning, setShouldDisplayPermissionWarning] = useState(false)
  const shouldDisplayWarnings = isActive && shouldDisplayPermissionWarning
  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    // only run if the release is active
    if (isActive) {
      void checkWithPermissionGuard(publishRelease, release._id).then((hasPermission) => {
        if (isMounted.current) setShouldDisplayPermissionWarning(!hasPermission)
        return null
      })

      // if it's a release that can be scheduled, check if it can be scheduled
      if (release.metadata.intendedPublishAt && isAtTimeRelease) {
        void checkWithPermissionGuard(schedule, release._id, new Date()).then((hasPermission) => {
          if (isMounted.current) setShouldDisplayPermissionWarning(!hasPermission)
          return null
        })
      }
    }
    return () => {
      isMounted.current = false
    }
  }, [
    checkWithPermissionGuard,
    isActive,
    isAtTimeRelease,
    publishRelease,
    release._id,
    release.metadata.intendedPublishAt,
    schedule,
  ])

  return (
    <Container width={3}>
      {/* Tight top padding: the header above already pads its bottom, so the title sits close under
          the breadcrumb instead of floating in a doubled gap. */}
      <Stack paddingX={3} paddingBottom={3} paddingTop={1} space={4}>
        {/* Clear zones: identity (title + description) on the left; a label -> value metadata panel
            on the right. Wraps to a single column on narrow widths (metadata stacks under the
            description). The pin control was removed (it's a global-perspective mode that belongs in
            the perspective bar, matching the Variants pin removal). */}
        <Flex align="flex-start" gap={4} wrap="wrap">
          <Box flex={1} style={{minWidth: 280}}>
            <ReleaseDetailsEditor release={release} />
          </Box>
          {/* The metadata is its own bordered surface — a distinct "properties" panel — rather than
              free-floating rows, so it reads as a discrete block next to the identity. */}
          <Card
            flex="none"
            border
            radius={3}
            padding={3}
            tone="transparent"
            style={{width: 260}}
            data-testid="release-detail-metadata"
          >
            <Stack space={2}>
              {isNotArchivedRelease(release) && (
                <Flex align="center" gap={3} justify="space-between" style={METADATA_ROW_STYLE}>
                  <Text muted size={1}>
                    {tRelease('dashboard.details.metadata.schedule')}
                  </Text>
                  <ReleaseTypePicker release={release} />
                </Flex>
              )}
              <Flex align="center" gap={3} justify="space-between" style={METADATA_ROW_STYLE}>
                <Text muted size={1}>
                  {tRelease('dashboard.details.metadata.status')}
                </Text>
                {/* minimal layout: an icon-only indicator (full message on hover) so the row stays a
                    fixed, aligned height instead of bloating with the validation text or a spinner. */}
                <ValidationProgressIndicator documents={documents} layout="minimal" />
              </Flex>
              {/* Created lives in the footer (with the author avatar), so it is not repeated here. */}
              <Flex align="center" gap={3} justify="space-between" style={METADATA_ROW_STYLE}>
                <Text muted size={1}>
                  {tRelease('dashboard.details.metadata.documents')}
                </Text>
                <Text size={1}>{documents.length}</Text>
              </Flex>
            </Stack>
          </Card>
        </Flex>
        {shouldDisplayError && (
          <Card data-testid="release-error-details" padding={4} radius={4} tone="critical">
            <Flex gap={3}>
              <Text size={1}>
                <ErrorOutlineIcon />
              </Text>
              <Stack space={4}>
                <Text size={1} weight="semibold">
                  {isAtTimeRelease
                    ? tRelease('failed-schedule-title')
                    : tRelease('failed-publish-title')}
                </Text>
                <Details title={tRelease('error-details-title')}>
                  <Text size={1} accent>
                    <code>{release.error?.message}</code>
                  </Text>
                </Details>
              </Stack>
            </Flex>
          </Card>
        )}

        {shouldDisplayWarnings && (
          <Card
            data-testid="release-permission-error-details"
            padding={4}
            radius={4}
            tone="caution"
          >
            <Flex gap={3}>
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
              <Stack space={3}>
                <Text size={1}>{tRelease('permission-missing-title')}</Text>
                <Text size={1} muted>
                  {tRelease('permission-missing-description')}
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {!isReleaseOpen && <ArchivedReleaseBanner release={release} />}
      </Stack>
    </Container>
  )
}
