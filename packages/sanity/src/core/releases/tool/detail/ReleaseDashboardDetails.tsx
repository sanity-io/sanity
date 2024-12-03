import {PinFilledIcon, PinIcon} from '@sanity/icons'
import {
  Box,
  // Custom button with full radius used here
  // eslint-disable-next-line no-restricted-imports
  Button,
  Container,
  Flex,
  Stack,
} from '@sanity/ui'
import {useCallback} from 'react'

import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../hooks'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../index'
import {getReleaseTone} from '../../util/getReleaseTone'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'
import {ReleaseTypePicker} from './ReleaseTypePicker'

export function ReleaseDashboardDetails({release}: {release: ReleaseDocument}) {
  const {state, _id} = release

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)

  const {globalReleaseDocumentId, setPerspective, setPerspectiveFromReleaseDocumentId} =
    usePerspective()

  const handlePinRelease = useCallback(() => {
    if (_id === globalReleaseDocumentId) {
      setPerspective('drafts')
    } else {
      setPerspectiveFromReleaseDocumentId(_id)
    }
  }, [_id, globalReleaseDocumentId, setPerspective, setPerspectiveFromReleaseDocumentId])

  return (
    <Container width={3}>
      <Stack padding={3} paddingY={[4, 4, 5, 6]} space={[3, 3, 4, 5]}>
        <Flex gap={1}>
          <Button
            disabled={state === 'archived' || state === 'published'}
            icon={_id === globalReleaseDocumentId ? PinFilledIcon : PinIcon}
            mode="bleed"
            onClick={handlePinRelease}
            padding={2}
            radius="full"
            selected={_id === globalReleaseDocumentId}
            space={2}
            text={tRelease('dashboard.details.pin-release')}
            tone={getReleaseTone(release)}
          />
          <ReleaseTypePicker release={release} />
        </Flex>

        <Box padding={2}>
          <ReleaseDetailsEditor release={release} />
        </Box>
      </Stack>
    </Container>
  )
}
