import {type ReleaseDocument} from '@sanity/client'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ClockIcon} from '@sanity/icons/Clock'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PinIcon} from '@sanity/icons/Pin'
import {PinFilledIcon} from '@sanity/icons/PinFilled'
import {UserIcon} from '@sanity/icons/User'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {DetailPropertiesPanel, type DetailPropertiesSection} from '../../../components/detailLayout'
import {RelativeTime} from '../../../components/RelativeTime'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {Details} from '../../../form/components/Details'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {useWorkspace} from '../../../studio/workspace'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {getDocumentValidationLoading} from '../../util/getDocumentValidationLoading'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {isNotArchivedRelease} from '../../util/util'
import {ArchivedReleaseBanner} from './ArchivedReleaseBanner'
import {isCreateReleaseEvent, type ReleaseEvent} from './events/types'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'
import {ReleaseTypePicker} from './ReleaseTypePicker'
import {ReleaseValidationBadge} from './ReleaseValidationBadge'
import {type DocumentInRelease} from './types'
import {ValidationProgressIndicator} from './ValidationProgressIndicator'

function ReleaseDashboardDetailsProduction({
  release,
  documents,
  shouldDisplayError,
  shouldDisplayWarnings,
  isAtTimeRelease,
  isReleaseOpen,
}: {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  shouldDisplayError: boolean
  shouldDisplayWarnings: boolean
  isAtTimeRelease: boolean
  isReleaseOpen: boolean
}) {
  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const {selectedReleaseId} = usePerspective()
  const setPerspective = useSetPerspective()
  const {document} = useWorkspace()
  const {
    drafts: {enabled: isDraftModelEnabled},
  } = document

  const isSelected = releaseId === selectedReleaseId
  const releaseFullTitle = release.metadata.title || tCore('release.placeholder-untitled-release')

  const handlePinRelease = useCallback(() => {
    if (isSelected) {
      setPerspective(isDraftModelEnabled ? 'drafts' : 'published')
    } else {
      setPerspective(releaseId)
    }
  }, [isDraftModelEnabled, isSelected, releaseId, setPerspective])

  return (
    <Container width={3}>
      <Stack padding={3} paddingY={[3, 3, 4, 5]}>
        <Flex gap={1} align="center">
          {isReleaseOpen && (
            <Button
              icon={isSelected ? PinFilledIcon : PinIcon}
              tooltipProps={{
                placement: 'top',
                content: isSelected
                  ? tRelease('dashboard.details.unpin-release')
                  : tRelease('dashboard.details.pin-release'),
              }}
              mode="bleed"
              onClick={handlePinRelease}
              radius="full"
              selected={isSelected}
              aria-label={
                isSelected
                  ? `${tRelease('dashboard.details.unpin-release')}: "${releaseFullTitle}"`
                  : `${tRelease('dashboard.details.pin-release')}: "${releaseFullTitle}"`
              }
              aria-live="assertive"
            />
          )}
          {isNotArchivedRelease(release) && <ReleaseTypePicker release={release} />}
          <ValidationProgressIndicator documents={documents} />
          {shouldDisplayError && (
            <Flex gap={2} padding={2} data-testid="release-error-details">
              <Text size={1}>
                <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
              </Text>
              <TextWithTone size={1} tone="critical">
                {isAtTimeRelease
                  ? tRelease('failed-schedule-title')
                  : tRelease('failed-publish-title')}
              </TextWithTone>
            </Flex>
          )}
          {shouldDisplayWarnings && (
            <Flex gap={2} padding={2} data-testid="release-permission-error-details">
              <Text size={1}>
                <ToneIcon icon={WarningOutlineIcon} tone="caution" />
              </Text>
              <TextWithTone size={1} tone="caution">
                {tRelease('permission-missing-title')}
              </TextWithTone>
            </Flex>
          )}
        </Flex>
        <Box padding={2}>
          <ReleaseDetailsEditor release={release} />
        </Box>
        {shouldDisplayError && (
          <Card padding={4} radius={4} tone="critical">
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
          <Card padding={4} radius={4} tone="caution">
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
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)
  const createAuthor = events.find(isCreateReleaseEvent)?.author

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

  if (!variantsEnabled) {
    return (
      <ReleaseDashboardDetailsProduction
        release={release}
        documents={documents}
        shouldDisplayError={shouldDisplayError}
        shouldDisplayWarnings={shouldDisplayWarnings}
        isAtTimeRelease={isAtTimeRelease}
        isReleaseOpen={isReleaseOpen}
      />
    )
  }

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
          <DetailPropertiesPanel
            testId="release-detail-metadata"
            sections={
              [
                {
                  rows: [
                    isNotArchivedRelease(release) && {
                      icon: <ReleaseAvatar release={release} padding={0} />,
                      label: tRelease('dashboard.details.metadata.schedule'),
                      value: <ReleaseTypePicker release={release} />,
                    },
                    {
                      icon: statusGlyph,
                      label: tRelease('dashboard.details.metadata.status'),
                      value: <ReleaseValidationBadge documents={documents} />,
                    },
                    {
                      icon: (
                        <Text size={1} muted>
                          <DocumentsIcon />
                        </Text>
                      ),
                      label: tRelease('dashboard.details.metadata.documents'),
                      value: String(documents.length),
                    },
                    {
                      icon: createAuthor ? (
                        <UserAvatar size={0} user={createAuthor} />
                      ) : (
                        <Text size={1} muted>
                          <UserIcon />
                        </Text>
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
              ] satisfies DetailPropertiesSection[]
            }
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
