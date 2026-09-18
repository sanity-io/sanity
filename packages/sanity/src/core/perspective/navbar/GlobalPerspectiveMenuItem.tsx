import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Stack, Text} from '@sanity/ui'
// oxlint-disable-next-line no-restricted-imports -- custom use for MenuItem not supported by ui-components
import {MenuItem} from '@sanity/ui/menu'
import {useCallback} from 'react'
import {Box, Flex} from 'ui5'

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
import {isDraftPerspective} from '../../releases/util/util'
import {useWorkspace} from '../../studio/workspace'
import {MarkedLabel} from '../MarkedLabel'
import {type ReleasesNavMenuItemPropsGetter} from '../types'

export function GlobalPerspectiveMenuItem(props: {
  release: ReleaseDocument | 'published' | typeof LATEST
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /** The active filter term. Its occurrences are marked inside the release title. */
  searchTerm?: string
}) {
  const {release, searchTerm} = props

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
      <Flex alignItems="flex-start" gap={1}>
        <Box
          flexBasis="auto"
          flexGrow={0}
          flexShrink={0}
          data-testid="release-indicator-icon"
          // 4px, so the icon's left edge lands where a section heading's text does: the section
          // card contributes 4px and the row another 4px, and the heading's own inset is 8px from
          // the card. The design aligns the two (PopoverMenu node 6998:20254); 12px here put the
          // icons visibly right of every heading above them.
          paddingLeft={1}
          // 4px here plus the parent Flex's own `gap={1}` is the 8px the design puts between the
          // icon and the title. `paddingX={3}` made it 16px, which read as a loose row.
          paddingRight={1}
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
          <Flex gap={3} alignItems="center">
            {isReleaseDocument(release) ? (
              <ReleaseTitle
                title={release.metadata.title}
                fallback={t('release.placeholder-untitled-release')}
                textProps={{size: 1, weight: 'medium', style: {minWidth: 0}}}
              >
                {({displayTitle}) => (
                  <Text size={1} weight="medium" style={{minWidth: 0}}>
                    {/*
                      `displayTitle` is already truncated to 50 characters, so a match past that
                      point is not marked here — the tooltip still carries the full title.
                    */}
                    <MarkedLabel label={displayTitle} searchTerm={searchTerm} />
                  </Text>
                )}
              </ReleaseTitle>
            ) : (
              <Text size={1} weight="medium" style={{minWidth: 0}}>
                <MarkedLabel
                  label={
                    isDraftPerspective(release)
                      ? t('release.navbar.drafts')
                      : t('release.navbar.published')
                  }
                  searchTerm={searchTerm}
                />
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
      </Flex>
    </MenuItem>
  )
}
