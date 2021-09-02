import React from 'react'
import {Box, Flex, Stack, Text, Skeleton, TextSkeleton, rem} from '@sanity/ui'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {PreviewProps} from './types'

const Root = styled(Flex)`
  height: 35px;
`

const MediaWrapper = styled(Flex)`
  position: relative;
  width: 35px;
  height: 35px;
  min-width: 35px;
  border-radius: ${({theme}) => rem(theme.sanity.radius[2])};

  & img {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    object-fit: contain;
    border-radius: inherit;
    width: 100%;
    height: 100%;
  }

  & svg {
    display: block;
    font-size: calc(21 / 16 * 1em);
  }

  & [data-sanity-icon] {
    display: block;
    font-size: calc(33 / 16 * 1em);
  }

  /*
    NOTE on why we can’t use the ":after" pseudo-element:

    The thing is we only want the shadow when then <MediaWrapper> contains
    something else than <svg> – icons should not have the shadow.

    This is why we use the "*:not(svg) + span" selector to target only that
    situation to render the shadow.
  */
  & *:not(svg) + span {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 0 1px var(--card-fg-color);
    opacity: 0.2;
    border-radius: inherit;
  }
`

MediaWrapper.displayName = 'MediaWrapper'

export const DefaultPreview = (props: PreviewProps<'default'>) => {
  const {title, subtitle, media, status, isPlaceholder, children} = props

  return (
    <Root align="center">
      {isPlaceholder && (
        <>
          {media !== false && (
            <Skeleton style={{width: 35, height: 35}} radius={2} marginRight={2} animated />
          )}

          <Stack flex={1} paddingLeft={media === false ? 1 : 0} space={2}>
            <TextSkeleton style={{maxWidth: 320}} radius={1} animated />
            <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated />
          </Stack>
        </>
      )}

      {!isPlaceholder && (
        <>
          {media !== false && media !== undefined && (
            <MediaWrapper align="center" justify="center" marginRight={2} overflow="hidden">
              {typeof media === 'function' &&
                media({
                  dimensions: {
                    width: 35,
                    height: 35,
                    aspect: 1,
                    fit: 'crop',
                    dpr: getDevicePixelRatio(),
                  },
                  layout: 'default',
                })}

              {typeof media === 'string' && <div>{media}</div>}

              {React.isValidElement(media) && media}

              <span />
            </MediaWrapper>
          )}

          <Stack flex={1} paddingLeft={media === false ? 1 : 0} space={2}>
            <Text textOverflow="ellipsis" style={{color: 'inherit'}}>
              {title && typeof title === 'function' ? title({layout: 'default'}) : title}
              {!title && <>Untitled</>}
            </Text>

            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {typeof subtitle === 'function' ? subtitle({layout: 'default'}) : subtitle}
              </Text>
            )}

            {children && <div>{children}</div>}
          </Stack>

          {status && (
            <Box paddingLeft={3} paddingRight={1}>
              {typeof status === 'function' ? status({layout: 'default'}) : status}
            </Box>
          )}
        </>
      )}
    </Root>
  )
}
