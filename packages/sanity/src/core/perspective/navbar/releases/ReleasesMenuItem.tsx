import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {LaunchIcon} from '@sanity/icons/Launch'
import {LockIcon} from '@sanity/icons/Lock'
// oxlint-disable-next-line no-restricted-imports -- custom use for Button not supported by ui-components
import {Button} from '@sanity/ui'
// oxlint-disable-next-line no-restricted-imports -- custom use for MenuItem not supported by ui-components
import {MenuItem} from '@sanity/ui/menu'
import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
  type RefAttributes,
} from 'react'
import {css, styled} from 'styled-components'
import {Text, Box, Flex, Icon} from 'ui5'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {ReleaseTitle} from '../../../releases/components/ReleaseTitle'
import {useFormatRelativeLocalePublishDate} from '../../../releases/hooks/useFormatRelativeLocalePublishDate'
import {isReleaseDocument} from '../../../releases/store/types'
import {LATEST, PUBLISHED} from '../../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isReleaseScheduledOrScheduling} from '../../../releases/util/util'
import {useWorkspace} from '../../../studio/workspace'
import {type ReleasesNavMenuItemPropsGetter} from '../../types'
import {useExcludedPerspective} from '../../useExcludedPerspective'
import {usePerspective} from '../../usePerspective'
import {useSetPerspective} from '../../useSetPerspective'
import {ReleaseDetailLink} from './ReleaseDetailLink'
import {ReleasesMenuItemIndicator} from './ReleasesLayerIndicator'

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

    [data-ui='MenuItem']:hover &,
    [data-ui='MenuItem'][data-hovered] & {
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

export function ReleasesMenuItem(
  props: {
    release: ReleaseDocument | 'published' | typeof LATEST
    rangePosition: rangePosition
    menuItemProps?: ReleasesNavMenuItemPropsGetter
    /** Called when the release's detail link is followed. */
    onNavigateToRelease?: () => void
  } & RefAttributes<HTMLDivElement>,
) {
  const {ref, release, rangePosition, onNavigateToRelease} = props
  const menuItemRef = useRef<HTMLButtonElement>(null)
  const detailLinkRef = useRef<HTMLAnchorElement>(null)
  const [detailLinkHovered, setDetailLinkHovered] = useState(false)

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const defaultPerspective = isDraftModelEnabled ? LATEST : PUBLISHED
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const {toggleExcludedPerspective, isPerspectiveExcluded} = useExcludedPerspective()
  const formatPublishDate = useFormatRelativeLocalePublishDate()
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

  const handleMenuItemKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' || !detailLinkRef.current) return
    event.preventDefault()
    detailLinkRef.current.focus()
  }, [])

  // The menu's own handler still receives the other keys: the arrow keys move on from this
  // release, because focusing the link leaves it as the menu's active item.
  const handleDetailLinkKeyDown = useCallback((event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      menuItemRef.current?.focus()
    } else if (event.key === ' ') {
      event.preventDefault()
      event.currentTarget.click()
    }
  }, [])

  const handleDetailLinkMouseEnter = useCallback(() => setDetailLinkHovered(true), [])
  const handleDetailLinkMouseLeave = useCallback(() => setDetailLinkHovered(false), [])

  const canReleaseBeExcluded = useMemo(() => {
    if (release === 'published') return false
    if (isDraftPerspective(release)) return isReleaseDocument(selectedPerspective)
    if (isReleaseScheduledOrScheduling(release)) return false
    return rangePosition && ['first', 'within'].includes(rangePosition)
  }, [rangePosition, release, selectedPerspective])

  return (
    <ReleasesMenuItemIndicator
      $isDefaultPerspective={isDefaultPerspective}
      $first={rangePosition === 'first'}
      $last={rangePosition === 'last'}
      $inRange={Boolean(rangePosition)}
      data-stack-line={rangePosition ? 'true' : undefined}
      ref={ref}
    >
      <MenuItem
        // The detail link lies over the item but outside it, so hovering the link ends the item's
        // own hover; `data-hovered` keeps the row highlighted
        data-hovered={detailLinkHovered ? '' : undefined}
        onClick={handleOnReleaseClick}
        onKeyDown={handleMenuItemKeyDown}
        padding={1}
        pressed={active}
        ref={menuItemRef}
        selected={active}
        data-testid={`release-${releaseId}`}
        {...props.menuItemProps?.({perspective: release})}
      >
        <Flex alignItems="flex-start" gap={1}>
          <IconWrapperBox
            $isExcluded={isReleasePerspectiveExcluded}
            flexBasis="auto"
            flexGrow={0}
            flexShrink={0}
            data-testid="release-indicator-icon"
            paddingX={3}
            paddingY={2}
          >
            <ReleaseAvatarIcon size="small" release={release} fontSize={2} />
          </IconWrapperBox>
          <Flex
            flexBasis="0%"
            flexGrow={1}
            paddingY={2}
            paddingRight={2}
            gap={2}
            style={{
              opacity: isReleasePerspectiveExcluded ? 0.5 : undefined,
              maxWidth: '200px',
            }}
            flexDirection="column"
          >
            <Flex gap={3} alignItems="center">
              {isReleaseDocument(release) ? (
                <ReleaseTitle
                  title={release.metadata.title}
                  fallback={t('release.placeholder-untitled-release')}
                  textProps={{size: 1, weight: 'medium', style: {minWidth: 0}}}
                />
              ) : (
                <Text
                  size={1}
                  weight="medium"
                  style={{minWidth: 0, color: 'inherit'}}
                  as="div"
                  trim={true}
                >
                  {isDraftPerspective(release)
                    ? t('release.navbar.drafts')
                    : t('release.navbar.published')}
                </Text>
              )}
              {isReleaseDocument(release) &&
                typeof release.error !== 'undefined' &&
                release.state === 'active' && (
                  <Box style={{margin: '-0.375rem'}}>
                    <Icon
                      size={1}
                      data-testid="release-error-icon"
                      icon={<ToneIcon icon={ErrorOutlineIcon} tone="critical" />}
                    />
                  </Box>
                )}
            </Flex>
            {isReleaseDocument(release) &&
              release.metadata.releaseType === 'scheduled' &&
              (release.publishAt || release.metadata.intendedPublishAt) && (
                <Text muted size={1} as="div" trim={true}>
                  {formatPublishDate(release)}
                </Text>
              )}
          </Flex>
          <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
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
                <Icon
                  size={1}
                  muted
                  data-testid="release-lock-icon"
                  icon={LockIcon}
                  style={{margin: '-0.375rem'}}
                />
              </Box>
            )}
          </Box>
          {isReleaseDocument(release) && (
            // Reserves the detail link's footprint: the same button, hidden and inert
            <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
              <Button
                as="span"
                data-testid="release-detail-link-space"
                icon={LaunchIcon}
                mode="bleed"
                padding={2}
                style={{visibility: 'hidden'}}
              />
            </Box>
          )}
        </Flex>
      </MenuItem>
      {isReleaseDocument(release) && (
        <ReleaseDetailLink
          onKeyDown={handleDetailLinkKeyDown}
          onMouseEnter={handleDetailLinkMouseEnter}
          onMouseLeave={handleDetailLinkMouseLeave}
          onNavigate={onNavigateToRelease}
          ref={detailLinkRef}
          releaseId={releaseId}
          title={release.metadata.title || t('release.placeholder-untitled-release')}
        />
      )}
    </ReleasesMenuItemIndicator>
  )
}
