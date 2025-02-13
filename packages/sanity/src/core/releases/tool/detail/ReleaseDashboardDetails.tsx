import {ErrorOutlineIcon, PinFilledIcon, PinIcon, WarningOutlineIcon} from '@sanity/icons'
import {
  Box,
  // Custom button with full radius used here
  // eslint-disable-next-line no-restricted-imports
  Button,
  Card,
  Container,
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {Details} from '../../../form/components/Details'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store'
import {type ReleaseDocument} from '../../store/types'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../util/getReleaseTone'
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
  const isSelected = releaseId === selectedReleaseId
  const isAtTimeRelease = release?.metadata?.releaseType === 'scheduled'
  const isActive = release.state === 'active'
  const shouldDisplayError = isActive && typeof release.error !== 'undefined'
  const [shouldDisplayPermissionWarning, setShouldDisplayPermissionWarning] = useState(false)
  const shouldDisplayWarnings = isActive && shouldDisplayPermissionWarning
  useEffect(() => {
    // only run if the release is active
    if (isActive) {
      checkWithPermissionGuard(publishRelease, release._id, false).then((hasPermission) => {
        setShouldDisplayPermissionWarning(!hasPermission)
      })

      // if it's a release that can be scheduled, check if it can be scheduled
      if (release.metadata.intendedPublishAt && isAtTimeRelease) {
        checkWithPermissionGuard(schedule, release._id, new Date()).then((hasPermission) => {
          setShouldDisplayPermissionWarning(!hasPermission)
        })
      }
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
      <Stack padding={3} paddingY={[4, 4, 5, 6]} space={[3, 3, 4, 5]}>
        <Flex gap={1} align="center">
          <Button
            disabled={state === 'archived' || state === 'published'}
            icon={isSelected ? PinFilledIcon : PinIcon}
            mode="bleed"
            onClick={handlePinRelease}
            padding={2}
            radius="full"
            selected={isSelected}
            space={2}
            text={tRelease('dashboard.details.pin-release')}
            tone={getReleaseTone(release)}
          />
          <ReleaseTypePicker release={release} />
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
                <Text>
                  {isAtTimeRelease
                    ? tRelease('failed-schedule-title')
                    : tRelease('failed-publish-title')}
                </Text>
                <Details title={tRelease('error-details-title')}>
                  <Text>
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
      </Stack>
    </Container>
  )
}
