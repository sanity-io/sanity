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
import {useStudioPerspectiveState} from '../../hooks/useStudioPerspectiveState'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../index'
import {getReleaseTone} from '../../util/getReleaseTone'
import {DRAFTS_PERSPECTIVE} from '../../util/perspective'
import {getReleaseIdFromReleaseDocumentId} from '../../util/releaseId'
import {ReleaseDetailsEditor} from './ReleaseDetailsEditor'
import {ReleaseTypePicker} from './ReleaseTypePicker'

export function ReleaseDashboardDetails({release}: {release: ReleaseDocument}) {
  const {state, _id} = release

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)

  const {current, setCurrent} = useStudioPerspectiveState()
  const selected = getReleaseIdFromReleaseDocumentId(_id) === current

  const handlePinRelease = useCallback(() => {
    if (selected) {
      // toggle off
      setCurrent(DRAFTS_PERSPECTIVE)
    } else {
      setCurrent(getReleaseIdFromReleaseDocumentId(_id))
    }
  }, [_id, selected, setCurrent])

  return (
    <Container width={3}>
      <Stack padding={3} paddingY={[4, 4, 5, 6]} space={[3, 3, 4, 5]}>
        <Flex gap={1}>
          <Button
            disabled={state === 'archived' || state === 'published'}
            icon={selected ? PinFilledIcon : PinIcon}
            mode="bleed"
            onClick={handlePinRelease}
            padding={2}
            radius="full"
            selected={selected}
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
