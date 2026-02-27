import {PinFilledIcon, PinIcon} from '@sanity/icons'
import {Box, Card, Flex, Skeleton, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {Button, Tooltip} from '../../../../../ui-components'
import {PREVIEW_SIZES} from '../../../../components/previews/constants'
import {TitleSkeleton} from '../../../../components/previews/general/DetailPreview.styled'
import {Translate, useTranslation} from '../../../../i18n'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useSetPerspective} from '../../../../perspective/useSetPerspective'
import {useWorkspace} from '../../../../studio/workspace'
import {ReleaseAvatar} from '../../../components/ReleaseAvatar'
import {ReleaseTitle} from '../../../components/ReleaseTitle'
import {releasesLocaleNamespace} from '../../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {type TableRowProps} from '../../components/Table/Table'
import {type VisibleColumn} from '../../components/Table/types'
import {type TableRelease} from '../ReleasesOverview'

export const ReleaseNameCell: VisibleColumn<TableRelease>['cell'] = ({
  cellProps,
  datum: release,
}) => {
  const router = useRouter()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {selectedReleaseId} = usePerspective()
  const setPerspective = useSetPerspective()
  const {state} = release
  const releaseId = release.isLoading ? 'loading' : getReleaseIdFromReleaseDocumentId(release._id)
  const isArchived = state === 'archived'
  const isReleasePinned = releaseId === selectedReleaseId
  const {document} = useWorkspace()
  const {
    drafts: {enabled: isDraftModelEnabled},
  } = document

  const handlePinRelease = useCallback(() => {
    if (isReleasePinned) {
      setPerspective(isDraftModelEnabled ? 'drafts' : 'published')
    } else {
      setPerspective(releaseId)
    }
  }, [isDraftModelEnabled, isReleasePinned, releaseId, setPerspective])

  if (release.isLoading) {
    return (
      <Box {...cellProps} paddingLeft={3} flex={1} paddingY={1} paddingRight={2} sizing="border">
        <Flex align="center" gap={2}>
          <Skeleton animated radius={1} style={PREVIEW_SIZES.default.media} />
          <TitleSkeleton />
        </Flex>
      </Box>
    )
  }

  const cardProps: TableRowProps = release.isDeleted
    ? {tone: 'transparent'}
    : {
        as: 'a',
        // navigate to release detail
        onClick: () => router.navigate({releaseId: releaseId}),
        tone: 'inherit',
      }

  const pinButtonIcon = isReleasePinned ? PinFilledIcon : PinIcon
  const releaseTitle = release.metadata.title || tCore('release.placeholder-untitled-release')

  return (
    <Box {...cellProps} paddingLeft={3} flex={1} paddingY={1} paddingRight={2} sizing="border">
      <Tooltip
        disabled={!release.isDeleted}
        content={
          <Text size={1}>
            <Translate t={t} i18nKey="deleted-release" values={{title: releaseTitle}} />
          </Text>
        }
      >
        <Flex align="center" gap={3}>
          <Button
            tooltipProps={{
              disabled: isArchived || release.state === 'published',
              content: isReleasePinned
                ? t('dashboard.details.unpin-release')
                : t('dashboard.details.pin-release'),
            }}
            disabled={isArchived || release.state === 'published'}
            icon={pinButtonIcon}
            mode="bleed"
            data-testid="pin-release-button"
            onClick={handlePinRelease}
            radius="full"
            selected={isReleasePinned}
            aria-label={
              isReleasePinned
                ? `${t('dashboard.details.unpin-release')}: "${releaseTitle}"`
                : `${t('dashboard.details.pin-release')}: "${releaseTitle}"`
            }
            aria-live="assertive"
          />
          <Card {...cardProps} padding={2} radius={2} flex={1}>
            <Flex align="center" gap={2}>
              <Box flex="none">
                <ReleaseAvatar release={release} />
              </Box>
              <Stack flex={1} space={2}>
                <Flex align="center" gap={2} style={{minWidth: 0}}>
                  <ReleaseTitle
                    title={release.metadata.title}
                    fallback={tCore('release.placeholder-untitled-release')}
                    textProps={{size: 1, weight: 'medium', style: {minWidth: 0}}}
                  />
                </Flex>
              </Stack>
            </Flex>
          </Card>
        </Flex>
      </Tooltip>
    </Box>
  )
}
