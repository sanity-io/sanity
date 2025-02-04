import {PinFilledIcon, PinIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {useRouter} from 'sanity/router'

import {Button, Tooltip} from '../../../../../ui-components'
import {Translate} from '../../../../i18n'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useSetPerspective} from '../../../../perspective/useSetPerspective'
import {ReleaseAvatar} from '../../../components/ReleaseAvatar'
import {releasesLocaleNamespace} from '../../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../../util/getReleaseTone'
import {type TableRowProps} from '../../components/Table/Table'
import {type Column} from '../../components/Table/types'
import {type TableRelease} from '../ReleasesOverview'

export const ReleaseNameCell: Column<TableRelease>['cell'] = ({cellProps, datum: release}) => {
  const router = useRouter()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {selectedReleaseId} = usePerspective()
  const setPerspective = useSetPerspective()
  const {state} = release
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const isArchived = state === 'archived'
  const isReleasePinned = releaseId === selectedReleaseId

  const handlePinRelease = useCallback(() => {
    if (isReleasePinned) {
      setPerspective('drafts')
    } else {
      setPerspective(releaseId)
    }
  }, [isReleasePinned, releaseId, setPerspective])

  const cardProps: TableRowProps = release.isDeleted
    ? {tone: 'transparent'}
    : {
        as: 'a',
        // navigate to release detail
        onClick: () => router.navigate({releaseId: releaseId}),
        tone: 'inherit',
      }

  const pinButtonIcon = isReleasePinned ? PinFilledIcon : PinIcon
  const displayTitle = release.metadata.title || tCore('release.placeholder-untitled-release')

  return (
    <Box {...cellProps} marginLeft={3} flex={1} paddingY={1} paddingRight={2} sizing={'border'}>
      <Tooltip
        disabled={!release.isDeleted}
        content={
          <Text size={1}>
            <Translate t={t} i18nKey="deleted-release" values={{title: displayTitle}} />
          </Text>
        }
      >
        <Flex align="center" gap={4}>
          <Button
            tooltipProps={{
              disabled: isArchived || release.state === 'published',
              content: t('dashboard.details.pin-release'),
            }}
            disabled={isArchived || release.state === 'published'}
            icon={pinButtonIcon}
            mode="bleed"
            data-testid="pin-release-button"
            onClick={handlePinRelease}
            radius="full"
            selected={isReleasePinned}
          />
          <Card {...cardProps} padding={2} radius={2} flex={1}>
            <Flex align="center" gap={2}>
              <Box flex="none">
                <ReleaseAvatar tone={getReleaseTone(release)} />
              </Box>
              <Stack flex={1} space={2}>
                <Flex align="center" gap={2}>
                  <Text size={1} weight="medium">
                    {displayTitle}
                  </Text>
                </Flex>
              </Stack>
            </Flex>
          </Card>
        </Flex>
      </Tooltip>
    </Box>
  )
}
