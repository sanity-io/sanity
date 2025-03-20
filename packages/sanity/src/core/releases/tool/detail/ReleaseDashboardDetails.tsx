import {
  ErrorOutlineIcon,
  InfoOutlineIcon,
  PinFilledIcon,
  PinIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {Details} from '../../../form/components/Details'
import {useProjectSubscriptions} from '../../../hooks/useProjectSubscriptions'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {isNotArchivedRelease} from '../../util/util'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'
import {ReleaseTypePicker} from './ReleaseTypePicker'

export function ReleaseDashboardDetails({release}: {release: ReleaseDocument}) {
  const {state} = release
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const {checkWithPermissionGuard} = useReleasePermissions()
  const {publishRelease, schedule} = useReleaseOperations()

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const {selectedReleaseId} = usePerspective()
  const setPerspective = useSetPerspective()
  const {projectSubscriptions} = useProjectSubscriptions()

  const retentionDays =
    projectSubscriptions?.featureTypes.retention.features[0].attributes.maxRetentionDays
  const isSelected = releaseId === selectedReleaseId
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
      checkWithPermissionGuard(publishRelease, release._id).then((hasPermission) => {
        if (isMounted.current) setShouldDisplayPermissionWarning(!hasPermission)
      })

      // if it's a release that can be scheduled, check if it can be scheduled
      if (release.metadata.intendedPublishAt && isAtTimeRelease) {
        checkWithPermissionGuard(schedule, release._id, new Date()).then((hasPermission) => {
          if (isMounted.current) setShouldDisplayPermissionWarning(!hasPermission)
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

  const handlePinRelease = useCallback(() => {
    if (isSelected) {
      setPerspective('drafts')
    } else {
      setPerspective(releaseId)
    }
  }, [isSelected, releaseId, setPerspective])

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
                  ? `${tRelease('dashboard.details.unpin-release')}: "${release.metadata.title}"`
                  : `${tRelease('dashboard.details.pin-release')}: "${release.metadata.title}"`
              }
              aria-live="assertive"
            />
          )}
          {isNotArchivedRelease(release) && <ReleaseTypePicker release={release} />}
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

        {!isReleaseOpen && retentionDays && (
          <Card padding={4} radius={4} tone="primary" data-testid="retention-policy-card">
            <Flex gap={3}>
              <Text size={1}>
                <InfoOutlineIcon />
              </Text>
              <Stack space={4}>
                <Text size={1} weight="semibold">
                  {state === 'archived'
                    ? tRelease('archive-info.title')
                    : tRelease('publish-info.title')}
                </Text>
                <Text size={1} accent>
                  {tRelease('archive-info.description', {retentionDays})}
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
