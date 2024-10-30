import {LockIcon, PinFilledIcon, PinIcon} from '@sanity/icons'
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
import {format, isBefore} from 'date-fns'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n'
import {type ReleaseDocument} from '../../../store'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {usePerspective} from '../../hooks'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseTone} from '../../util/getReleaseTone'
import {getReleasePublishDate} from '../../util/util'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'

export function ReleaseDashboardDetails({release}: {release: ReleaseDocument}) {
  const {state, _id} = release

  const {t: tCore} = useTranslation(releasesLocaleNamespace)
  const {t} = useTranslation()

  const {currentGlobalBundleId, setPerspective, setPerspectiveFromRelease} = usePerspective()

  const handlePinRelease = useCallback(() => {
    if (_id === currentGlobalBundleId) {
      setPerspective('drafts')
    } else {
      setPerspectiveFromRelease(_id)
    }
  }, [_id, currentGlobalBundleId, setPerspective, setPerspectiveFromRelease])

  const publishDate = getReleasePublishDate(release)
  const isPublishDateInPast = !!publishDate && isBefore(new Date(publishDate), new Date())
  const isReleaseScheduled = release.state === 'scheduling' || release.state === 'scheduled'

  const publishDateLabel = useMemo(() => {
    if (release.metadata.releaseType === 'asap') return t('release.type.asap')
    if (release.metadata.releaseType === 'undecided') return t('release.type.undecided')
    if (!publishDate) return null

    return isPublishDateInPast
      ? tCore('dashboard.details.published-on', {
          date: format(new Date(publishDate), `MMM d, yyyy`),
        })
      : format(new Date(publishDate), `PPpp`)
  }, [isPublishDateInPast, publishDate, release.metadata.releaseType, t, tCore])

  return (
    <Container width={3}>
      <Stack padding={3} paddingY={[4, 4, 5, 6]} space={[3, 3, 4, 5]}>
        <Flex gap={1}>
          <Button
            disabled={state === 'archived' || state === 'published'}
            icon={_id === currentGlobalBundleId ? PinFilledIcon : PinIcon}
            mode="bleed"
            onClick={handlePinRelease}
            padding={2}
            radius="full"
            selected={_id === currentGlobalBundleId}
            space={2}
            text={tCore('dashboard.details.pin-release')}
            tone={getReleaseTone(release)}
          />
          {/* TODO: replace with the release time field here //{' '} */}
          {/* <ReleaseTimeField onChange={handleTimeChange} release={release} value={timeValue} /> */}
          <Card
            padding={2}
            style={isReleaseScheduled ? {opacity: 0.75} : undefined}
            radius={2}
            tone={isReleaseScheduled ? 'positive' : 'transparent'}
          >
            <Flex flex={1} gap={2} align="center">
              <ReleaseAvatar padding={0} tone={getReleaseTone(release)} />
              <Text muted size={1} weight="medium">
                {publishDateLabel}
              </Text>
              {isReleaseScheduled && <LockIcon />}
            </Flex>
          </Card>
        </Flex>

        <Box padding={2}>
          <ReleaseDetailsEditor release={release} />
        </Box>
      </Stack>
    </Container>
  )
}
