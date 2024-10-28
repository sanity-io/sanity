import {EyeOpenIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- custom use for MenuItem not supported by ui-components
import {Box, Flex, MenuItem, Stack, Text} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {getReleaseTone, RelativeTime, ReleaseAvatar, type ReleaseDocument} from 'sanity'

import {usePerspective} from '../hooks/usePerspective'
import {GlobalPerspectiveMenuItemIndicator} from './PerspectiveLayerIndicator'

export interface LayerRange {
  firstIndex: number
  lastIndex: number
  offsets: {
    asap: number
    scheduled: number
    undecided: number
  }
}

export function getRangePosition(
  range: LayerRange,
  index: number,
): 'first' | 'within' | 'last' | undefined {
  const {firstIndex, lastIndex} = range

  if (firstIndex === lastIndex) return undefined
  if (index === firstIndex) return 'first'
  if (index === lastIndex) return 'last'
  if (index > firstIndex && index < lastIndex) return 'within'

  return undefined
}

export function GlobalPerspectiveMenuItem(props: {
  release: ReleaseDocument
  rangePosition: 'first' | 'within' | 'last' | undefined
  toggleable: boolean
}) {
  const {release, rangePosition, toggleable} = props
  //   const {current, replace: replaceVersion, replaceToggle} = usePerspective()
  const {currentGlobalBundle, setPerspectiveFromRelease, setPerspective} = usePerspective()
  const active = release._id === currentGlobalBundle._id
  const first = rangePosition === 'first'
  const within = rangePosition === 'within'
  const last = rangePosition === 'last'
  const inRange = first || within || last

  const handleToggleReleaseVisibility = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }, [])

  const handleOnReleaseClick = useCallback(
    () =>
      release._id === 'published'
        ? setPerspective('published')
        : setPerspectiveFromRelease(release._id),
    [release._id, setPerspective, setPerspectiveFromRelease],
  )

  return (
    <GlobalPerspectiveMenuItemIndicator $first={first} $last={last} $inRange={inRange}>
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
              {/* {release.hidden ? (
                <DotIcon
                  style={
                    {
                      '--card-icon-color': 'var(--card-border-color)',
                    } as CSSProperties
                  }
                />
              ) : ( */}
              <ReleaseAvatar tone={getReleaseTone(release)} />
              {/* )} */}
            </Text>
          </Box>
          <Stack
            flex={1}
            paddingY={2}
            paddingRight={2}
            space={2}
            style={
              {
                //   opacity: release.hidden ? 0.5 : undefined,
              }
            }
          >
            <Text size={1} weight="medium">
              {release.metadata.title}
            </Text>
            {release.metadata.releaseType !== 'undecided' &&
              (release.publishAt || release.metadata.intendedPublishAt) && (
                <Text muted size={1}>
                  <RelativeTime
                    time={(release.publishAt || release.metadata.intendedPublishAt)!}
                    useTemporalPhrase
                  />
                </Text>
              )}
          </Stack>
          <Box flex="none">
            {!toggleable && (
              <Box padding={2} style={{opacity: 0}}>
                <Text size={1}>
                  <EyeOpenIcon />
                </Text>
              </Box>
            )}
            {/* {toggleable && (
              <ToggleLayerButton
                $visible={!release.hidden}
                forwardedAs="div"
                disabled={!active}
                icon={release.hidden ? EyeClosedIcon : EyeOpenIcon}
                mode="bleed"
                onClick={handleToggleReleaseVisibility}
                padding={2}
              />
            )} */}
          </Box>
        </Flex>
      </MenuItem>
    </GlobalPerspectiveMenuItemIndicator>
  )
}
