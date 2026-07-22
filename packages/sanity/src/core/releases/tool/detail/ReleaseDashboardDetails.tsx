import {type ReleaseDocument} from '@sanity/client'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ClockIcon} from '@sanity/icons/Clock'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'

import {AvatarSkeleton, RelativeTime, UserAvatar} from '../../../components'
import {DetailPropertiesPanel} from '../../../components/detailLayout'
import {Details} from '../../../form/components/Details'
import {useTranslation} from '../../../i18n'
import {useWorkspace} from '../../../studio/workspace'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {getDocumentValidationLoading} from '../../util/getDocumentValidationLoading'
import {isNotArchivedRelease} from '../../util/util'
import {ArchivedReleaseBanner} from './ArchivedReleaseBanner'
import {isCreateReleaseEvent, type ReleaseEvent} from './events/types'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'
import {ReleaseTypePicker} from './ReleaseTypePicker'
import {ReleaseValidationBadge} from './ReleaseValidationBadge'
import {type DocumentInRelease} from './types'
import {ValidationProgressIndicator} from './ValidationProgressIndicator'

export function ReleaseDashboardDetails({
  release,
  documents,
  events,
}: {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  events: ReleaseEvent[]
}) {
  const {state} = release

  const {checkWithPermissionGuard} = useReleasePermissions()
  const {publishRelease, schedule} = useReleaseOperations()

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  // Behind beta.variants the footer is dropped, so its "Created" status is rehomed here.
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)
  const createAuthor = events.find(isCreateReleaseEvent)?.author

  // Status glyph (beta): a semantic-coloured icon accompanying the Status label — checkmark when
  // valid, error when any document fails, clock while validating. Mirrors the value that
  // ReleaseValidationBadge renders. The tone-scoped transparent Card colours the icon.
  const validation = getDocumentValidationLoading(documents)
  const isFullyValidated = documents.length > 0 && validation.validatedCount === documents.length
  const statusTone = validation.hasError ? 'critical' : isFullyValidated ? 'positive' : 'default'
  const statusGlyphIcon = validation.hasError ? (
    <ErrorOutlineIcon />
  ) : isFullyValidated ? (
    <CheckmarkCircleIcon />
  ) : (
    <ClockIcon />
  )
  const statusGlyph =
    documents.length === 0 ? undefined : (
      <Card tone={statusTone} style={{background: 'transparent'}}>
        <Text size={1}>{statusGlyphIcon}</Text>
      </Card>
    )

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
          {/* The metadata is its own bordered surface — the shared properties panel — so it reads
              as a discrete block next to the identity. In production "Created" lives in the footer;
              behind beta.variants the footer is dropped, so a Created row is added here instead. */}
          <DetailPropertiesPanel
            testId="release-detail-metadata"
            sections={[
              {
                rows: [
                  isNotArchivedRelease(release) && {
                    // Leading glyph reflects the live release type (bolt / clock / dot), tone-coloured.
                    icon: variantsEnabled ? (
                      <ReleaseAvatar release={release} padding={0} />
                    ) : undefined,
                    label: tRelease('dashboard.details.metadata.schedule'),
                    value: <ReleaseTypePicker release={release} />,
                  },
                  {
                    icon: variantsEnabled ? statusGlyph : undefined,
                    label: tRelease('dashboard.details.metadata.status'),
                    // Beta: semantic-coloured text ("Valid" / "Errors" / …) so the panel clearly
                    // signals "good to go". Production keeps the minimal icon indicator unchanged.
                    value: variantsEnabled ? (
                      <ReleaseValidationBadge documents={documents} />
                    ) : (
                      <ValidationProgressIndicator documents={documents} layout="minimal" />
                    ),
                  },
                  {
                    label: tRelease('dashboard.details.metadata.documents'),
                    value: String(documents.length),
                  },
                  variantsEnabled && {
                    // The author avatar is the Created row's leading glyph; the value stays plain text.
                    icon: createAuthor ? (
                      <UserAvatar size={0} user={createAuthor} />
                    ) : (
                      <AvatarSkeleton $size={0} />
                    ),
                    label: tRelease('footer.status.created'),
                    value: (
                      <Text size={1}>
                        <RelativeTime time={release._createdAt} useTemporalPhrase minimal />
                      </Text>
                    ),
                  },
                ],
              },
            ]}
          />
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
