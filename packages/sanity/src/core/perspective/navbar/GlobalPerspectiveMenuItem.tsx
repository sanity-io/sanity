import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {LockIcon} from '@sanity/icons/Lock'
import {Flex, Stack, Text} from '@sanity/ui'
// oxlint-disable-next-line no-restricted-imports -- custom use for MenuItem not supported by ui-components
import {MenuItem} from '@sanity/ui/menu'
import {useCallback} from 'react'
import {Box} from 'ui5'

import {ToneIcon} from '../../../ui-components/toneIcon/ToneIcon'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {usePerspective} from '../../perspective/usePerspective'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {ReleaseTitle} from '../../releases/components/ReleaseTitle'
import {useFormatRelativeLocalePublishDate} from '../../releases/hooks/useFormatRelativeLocalePublishDate'
import {isReleaseDocument} from '../../releases/store/types'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isReleaseScheduledOrScheduling} from '../../releases/util/util'
import {useWorkspace} from '../../studio/workspace'
import {type ReleasesNavMenuItemPropsGetter} from '../types'

export function GlobalPerspectiveMenuItem(props: {
  release: ReleaseDocument | 'published' | typeof LATEST
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}) {
  const {release} = props

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const defaultPerspective = isDraftModelEnabled ? LATEST : PUBLISHED
  const {selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const formatPublishDate = useFormatRelativeLocalePublishDate()
  const releaseId = isReleaseDocument(release)
    ? getReleaseIdFromReleaseDocumentId(release._id)
    : release

  const isDefaultPerspective = release === defaultPerspective

  const active = selectedPerspectiveName
    ? releaseId === selectedPerspectiveName
    : isDefaultPerspective

  const {t} = useTranslation()

  const handleOnReleaseClick = useCallback(
    () => setPerspective(releaseId),
    [releaseId, setPerspective],
  )

  return (
    <MenuItem
      onClick={handleOnReleaseClick}
      padding={1}
      pressed={active}
      selected={active}
      data-testid={`release-${releaseId}`}
      {...props.menuItemProps?.({perspective: release})}
    >
      <Flex align="flex-start" gap={1}>
        <Box
          flexBasis="auto"
          flexGrow={0}
          flexShrink={0}
          data-testid="release-indicator-icon"
          paddingX={3}
          paddingY={2}
        >
          <Text size={2}>
            <ReleaseAvatarIcon size="small" release={release} />
          </Text>
        </Box>
        <Stack
          flex={1}
          paddingY={2}
          paddingRight={2}
          gap={2}
          style={{maxWidth: '200px', minWidth: 0}}
        >
          <Flex gap={3} align="center" style={{minWidth: 0}}>
            {isReleaseDocument(release) ? (
              <ReleaseTitle
                title={release.metadata.title}
                fallback={t('release.placeholder-untitled-release')}
                textProps={{size: 1, weight: 'medium', style: {minWidth: 0}}}
              />
            ) : (
              <Text size={1} weight="medium" style={{minWidth: 0}}>
                {isDraftPerspective(release)
                  ? t('release.navbar.drafts')
                  : t('release.navbar.published')}
              </Text>
            )}
            {isReleaseDocument(release) &&
              typeof release.error !== 'undefined' &&
              release.state === 'active' && (
                <Text size={1} data-testid="release-error-icon">
                  <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
                </Text>
              )}
          </Flex>
          {isReleaseDocument(release) &&
            release.metadata.releaseType === 'scheduled' &&
            (release.publishAt || release.metadata.intendedPublishAt) && (
              <Text muted size={1}>
                {formatPublishDate(release)}
              </Text>
            )}
        </Stack>
        <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
          {isReleaseDocument(release) && isReleaseScheduledOrScheduling(release) && (
            <Box padding={2}>
              <Text size={1} data-testid="release-lock-icon">
                <LockIcon />
              </Text>
            </Box>
          )}
        </Box>
      </Flex>
    </MenuItem>
  )
}
