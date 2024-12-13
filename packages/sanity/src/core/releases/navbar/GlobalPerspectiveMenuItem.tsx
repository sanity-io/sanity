import {type ReleaseId} from '@sanity/client'
import {DotIcon, EyeClosedIcon, EyeOpenIcon, LockIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- custom use for MenuItem & Button not supported by ui-components
import {Box, Button, Flex, MenuItem, Stack, Text} from '@sanity/ui'
import {type CSSProperties, forwardRef, type MouseEvent, useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../ui-components/tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {ReleaseAvatar} from '../components/ReleaseAvatar'
import {usePerspective} from '../hooks/usePerspective'
import {isReleaseDocument, type ReleaseDocument} from '../store/types'
import {type LATEST} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../util/getReleaseTone'
import {
  formatRelativeLocalePublishDate,
  isDraftPerspective,
  isPublishedPerspective,
  isReleaseScheduledOrScheduling,
} from '../util/util'
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

const ExcludedLayerDot = () => (
  <Box padding={3}>
    <Text size={1}>
      <DotIcon
        style={
          {
            opacity: 0,
          } as CSSProperties
        }
      />
    </Text>
  </Box>
)

type rangePosition = 'first' | 'within' | 'last' | undefined

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
  }
>((props, ref) => {
  const {release, rangePosition} = props
  const {
    setPerspective,
    selectedPerspective,
    selectedPerspectiveName,
    toggleExcludedPerspective,
    isPerspectiveExcluded,
  } = usePerspective()

  // eslint-disable-next-line no-nested-ternary
  const releaseId: 'published' | 'drafts' | ReleaseId = isReleaseDocument(release)
    ? (getReleaseIdFromReleaseDocumentId(release._id) as ReleaseId)
    : isDraftPerspective(release)
      ? (release._id as 'drafts')
      : (release as 'published')

  const active = selectedPerspectiveName
    ? releaseId === selectedPerspectiveName
    : isDraftPerspective(release)

  const isReleasePerspectiveExcluded = isPerspectiveExcluded(releaseId)

  const {t} = useTranslation()

  const displayTitle = useMemo(() => {
    if (isPublishedPerspective(release)) return t('release.navbar.published')
    if (isDraftPerspective(release)) return t('release.navbar.drafts')

    return release.metadata.title || t('release.placeholder-untitled-release')
  }, [release, t])

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
      $isDraft={isDraftPerspective(release)}
      $first={rangePosition === 'first'}
      $last={rangePosition === 'last'}
      $inRange={Boolean(rangePosition)}
      ref={ref}
    >
      <MenuItem onClick={handleOnReleaseClick} padding={1} pressed={active}>
        <Flex align="flex-start" gap={1}>
          <Box
            flex="none"
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Text size={1}>
              {isReleasePerspectiveExcluded ? (
                <ExcludedLayerDot />
              ) : (
                <ReleaseAvatar tone={getReleaseTone(release)} />
              )}
            </Text>
          </Box>
          <Stack
            flex={1}
            paddingY={2}
            paddingRight={2}
            space={2}
            style={{
              opacity: isReleasePerspectiveExcluded ? 0.5 : undefined,
            }}
          >
            <Text size={1} weight="medium">
              {displayTitle}
            </Text>
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
