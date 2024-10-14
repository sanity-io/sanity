import {PinFilledIcon, PinIcon} from '@sanity/icons'
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
import {format} from 'date-fns'
import {useCallback} from 'react'
import {type BundleDocument, usePerspective, useTranslation} from 'sanity'

import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseTone} from '../../util/getReleaseTone'
import {ReleaseAvatar} from '../components/ReleaseAvatar'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'

export function ReleaseDashboardDetails({release}: {release: BundleDocument}) {
  const {archived, _id, publishedAt} = release
  const {t} = useTranslation(releasesLocaleNamespace)

  const {currentGlobalBundle, setPerspective} = usePerspective()

  const handlePinRelease = useCallback(() => {
    if (_id === currentGlobalBundle._id) {
      setPerspective('drafts')
    } else {
      setPerspective(_id)
    }
  }, [_id, currentGlobalBundle._id, setPerspective])

  return (
    <Container width={3}>
      <Stack padding={3} paddingY={[4, 4, 5, 6]} space={[3, 3, 4, 5]}>
        <Flex gap={1}>
          <Button
            disabled={publishedAt !== undefined || archived}
            icon={_id === currentGlobalBundle._id ? PinFilledIcon : PinIcon}
            mode="bleed"
            onClick={handlePinRelease}
            padding={2}
            radius="full"
            selected={_id === currentGlobalBundle._id}
            space={2}
            text={t('dashboard.details.pin-release')}
            tone={getReleaseTone(release)}
          />

          {
            publishedAt ? (
              <Card padding={2} radius={2} tone="positive">
                <Flex flex={1} gap={2}>
                  <ReleaseAvatar padding={0} release={release} />
                  <Text muted size={1} weight="medium">
                    {t('dashboard.details.published-on', {
                      date: format(new Date(publishedAt), `MMM d, yyyy`),
                    })}
                  </Text>
                </Flex>
              </Card>
            ) : null
            // TODO: Add the release time field here
            // <ReleaseTimeField onChange={handleTimeChange} release={release} value={timeValue} />
          }
        </Flex>

        <Box padding={2}>
          <ReleaseDetailsEditor description={release.description} title={release.title} />
        </Box>
      </Stack>
    </Container>
  )
}
