import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon, EyeClosedIcon, EyeOpenIcon, LockIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- custom use for MenuItem & Button not supported by ui-components
import {Box, Button, Flex, MenuItem, Stack, Text} from '@sanity/ui'
import {forwardRef, type MouseEvent, useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {ToneIcon} from '../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../ui-components/tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useExcludedPerspective} from '../../perspective/useExcludedPerspective'
import {usePerspective} from '../../perspective/usePerspective'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {ReleaseTitle} from '../../releases/components/ReleaseTitle'
import {isReleaseDocument} from '../../releases/store/types'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {
  formatRelativeLocalePublishDate,
  isDraftPerspective,
  isReleaseScheduledOrScheduling,
} from '../../releases/util/util'
import {useWorkspace} from '../../studio/workspace'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {GlobalPerspectiveMenuItemIndicator} from './PerspectiveLayerIndicator'

export interface LayerRange {
  lastIndex: number
  offsets: {
    asap: number
    scheduled: number
    undecided: number
  }
}

const ToggleLayerButton = styled(Button)<{$visible: boolean}>(
  ({$visible}) => css`
    --card-fg-color: inherit;
    --card-icon-color: inherit;

    background-color: inherit;
    opacity: ${$visible ? 0 : 1};

    @media (hover: hover) {
      &:not([data-disabled='true']):hover {
        --card-fg-color: inherit;
        --card-icon-color: inherit;
      }
    }

    [data-ui='MenuItem']:hover & {
      opacity: 1;
    }
  `,
)

type rangePosition = 'first' | 'within' | 'last' | undefined
const IconWrapperBox = styled(Box)<{$isExcluded: boolean}>(
  ({$isExcluded}) => css`
    position: relative;
    z-index: 1;
    border-radius: 50%;
    /* background-color: var(--card-background-color);  */
    opacity: ${$isExcluded ? 0 : 1};
    // The icon needs a white background to visually sit on top of the line indicator
    & svg {
      background-color: var(--card-bg-color);
    }
  `,
)

export function getRangePosition(range: LayerRange, index: number): rangePosition {
  const {lastIndex} = range

  if (lastIndex === 0) return undefined
  if (index === 0) return 'first'
  if (index === lastIndex) return 'last'
  if (index > 0 && index < lastIndex) return 'within'

  return undefined
}

export const GlobalPerspectiveMenuItem = forwardRef<
  HTMLDivElement,
  {
    release: ReleaseDocument | 'published' | typeof LATEST
    rangePosition: rangePosition
    menuItemProps?: ReleasesNavMenuItemPropsGetter
  }
>((props, ref) => {
  const {release, rangePosition} = props

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const defaultPerspective = isDraftModelEnabled ? LATEST : PUBLISHED
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const {toggleExcludedPerspective, isPerspectiveExcluded} = useExcludedPerspective()
  const releaseId = isReleaseDocument(release)
    ? getReleaseIdFromReleaseDocumentId(release._id)
    : release

  const isDefaultPerspective = release === defaultPerspective

  const active = selectedPerspectiveName
    ? releaseId === selectedPerspectiveName
    : isDefaultPerspective

  const isReleasePerspectiveExcluded = isPerspectiveExcluded(releaseId)

  const {t} = useTranslation()

  const handleToggleReleaseVisibility = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation()
      toggleExcludedPerspective(releaseId)
    },
    [toggleExcludedPerspective, releaseId],
  )

  const handleOnReleaseClick = useCallback(
    () => setPerspective(releaseId),
    [releaseId, setPerspective],
  )

  const canReleaseBeExcluded = useMemo(() => {
    if (release === 'published') return false
    if (isDraftPerspective(release)) return isReleaseDocument(selectedPerspective)
    if (isReleaseScheduledOrScheduling(release)) return false
    return rangePosition && ['first', 'within'].includes(rangePosition)
  }, [rangePosition, release, selectedPerspective])

  return (
    <GlobalPerspectiveMenuItemIndicator
      $isDefaultPerspective={isDefaultPerspective}
      $first={rangePosition === 'first'}
      $last={rangePosition === 'last'}
      $inRange={Boolean(rangePosition)}
      ref={ref}
    >
      <MenuItem
        onClick={handleOnReleaseClick}
        padding={1}
        pressed={active}
        selected={active}
        data-testid={`release-${releaseId}`}
        {...props.menuItemProps?.({perspective: release})}
      >
        <Flex align="flex-start" gap={1}>
          <IconWrapperBox
            $isExcluded={isReleasePerspectiveExcluded}
            flex="none"
            data-testid="release-indicator-icon"
            paddingX={3}
            paddingY={2}
          >
            <Text size={1}>
              <ReleaseAvatarIcon release={release} />
            </Text>
          </IconWrapperBox>
          <Stack
            flex={1}
            paddingY={2}
            paddingRight={2}
            space={2}
            style={{
              opacity: isReleasePerspectiveExcluded ? 0.5 : undefined,
              maxWidth: '200px',
              minWidth: 0,
            }}
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
                  {formatRelativeLocalePublishDate(release)}
                </Text>
              )}
          </Stack>
          <Box flex="none">
            {canReleaseBeExcluded && (
              <Tooltip portal content={t('release.layer.hide')} placement="bottom">
                <ToggleLayerButton
                  $visible={!isReleasePerspectiveExcluded}
                  forwardedAs="div"
                  icon={isReleasePerspectiveExcluded ? EyeClosedIcon : EyeOpenIcon}
                  mode="bleed"
                  onClick={handleToggleReleaseVisibility}
                  padding={2}
                  data-testid="release-toggle-visibility"
                />
              </Tooltip>
            )}
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
    </GlobalPerspectiveMenuItemIndicator>
  )
})

GlobalPerspectiveMenuItem.displayName = 'GlobalPerspectiveMenuItem'
