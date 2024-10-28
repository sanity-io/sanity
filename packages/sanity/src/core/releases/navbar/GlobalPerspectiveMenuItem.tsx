import {EyeOpenIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- custom use for MenuItem not supported by ui-components
import {Box, Flex, MenuItem, Stack, Text} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {getReleaseTone, RelativeTime, ReleaseAvatar, type ReleaseDocument} from 'sanity'
import {styled} from 'styled-components'

import {usePerspective} from '../hooks/usePerspective'

const Root = styled.div`
  position: relative;

  &[data-in-range]:not([data-last]):after {
    content: '';
    display: block;
    position: absolute;
    left: 18px;
    bottom: -4px;
    width: 5px;
    height: 4px;
    background-color: var(--card-border-color);
  }

  &[data-in-range] > [data-ui='MenuItem'] {
    position: relative;

    &:before {
      content: '';
      display: block;
      position: absolute;
      left: 18px;
      top: 0;
      width: 5px;
      height: 16.5px;
      background-color: var(--card-border-color);
    }

    &:after {
      content: '';
      display: block;
      position: absolute;
      left: 18px;
      top: 16.5px;
      bottom: 0;
      width: 5px;
      background-color: var(--card-border-color);
    }
  }

  &[data-first] > [data-ui='MenuItem']:before {
    display: none;
  }

  &[data-last] > [data-ui='MenuItem']:after {
    display: none;
  }
`

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
    <Root
      data-active={active ? '' : undefined}
      data-first={first ? '' : undefined}
      data-in-range={inRange ? '' : undefined}
      data-last={last ? '' : undefined}
      //   data-hidden={release.hidden ? '' : undefined}
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
    </Root>
  )
}
