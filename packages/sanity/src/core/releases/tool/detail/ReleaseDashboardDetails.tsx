import {ErrorOutlineIcon, PinFilledIcon, PinIcon} from '@sanity/icons'
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
import {useCallback} from 'react'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {Details} from '../../../form/components/Details'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../util/getReleaseTone'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'
import {ReleaseTypePicker} from './ReleaseTypePicker'

export function ReleaseDashboardDetails({release}: {release: ReleaseDocument}) {
  const {state} = release
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const {selectedReleaseId} = usePerspective()
  const setPerspective = useSetPerspective()
  const isSelected = releaseId === selectedReleaseId
  const shouldDisplayError = release.state === 'active' && typeof release.error !== 'undefined'

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
                {tRelease('failed-publish-title')}
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
                <Text>{tRelease('failed-publish-title')}</Text>
                <Details title={tRelease('error-details-title')}>
                  <Text>
                    <code>{release.error?.message}</code>
                  </Text>
                </Details>
              </Stack>
            </Flex>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
