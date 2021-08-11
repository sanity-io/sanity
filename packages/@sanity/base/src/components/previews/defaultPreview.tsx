import React from 'react'
import {Box, Flex, Stack, Text, Skeleton, TextSkeleton} from '@sanity/ui'
import styled from 'styled-components'
import {PreviewProps} from './types'

const Root = styled(Flex)`
  height: 35px;
`

const MediaWrapper = styled(Flex)`
  position: relative;
  width: 35px;
  height: 35px;
  min-width: 35px;
  border-radius: ${({theme}) => theme.sanity.radius[2]}px;

  & img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }

  & svg {
    display: block;
    font-size: calc(21 / 16 * 1em);

    &[data-sanity-icon] {
      font-size: calc(33 / 16 * 1em);
      margin: calc(6 / 36 * -1em);
    }
  }

  & img + span {
    display: block;
    position: absolute;
    inset: 0 0 0 0;
    box-shadow: inset 0 0 0 1px var(--card-fg-color);
    opacity: 0.2;
    border-radius: inherit;
  }
`

export const DefaultPreview = (props: PreviewProps<'default'>) => {
  const {title, subtitle, media, status, isPlaceholder, children} = props

  return (
    <Root align="center">
      {isPlaceholder && (
        <>
          <Skeleton style={{width: 35, height: 35}} radius={2} marginRight={3} animated />
          <Stack space={2} flex={1}>
            <TextSkeleton style={{maxWidth: 320}} radius={1} animated />
            <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated />
          </Stack>
        </>
      )}

      {!isPlaceholder && (
        <>
          {media !== false && media !== undefined && (
            <MediaWrapper
              align="center"
              justify="center"
              marginRight={2}
              sizing="border"
              overflow="hidden"
            >
              {typeof media === 'function' &&
                media({
                  dimensions: {width: 80, height: 80, aspect: 1, fit: 'crop'},
                  layout: 'default',
                })}

              {typeof media === 'string' && <div>{media}</div>}

              {React.isValidElement(media) && media}

              <span />
            </MediaWrapper>
          )}

          <Stack space={2} flex={1}>
            <Text textOverflow="ellipsis" style={{color: 'inherit'}}>
              {title && (
                <>
                  {typeof title !== 'function' && title}
                  {typeof title === 'function' && title({layout: 'default'})}
                </>
              )}
              {!title && <>Untitled</>}
            </Text>

            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
              </Text>
            )}

            {children && <div>{children}</div>}
          </Stack>

          {status && (
            <Box padding={3}>
              {(typeof status === 'function' && status({layout: 'default'})) || status}
            </Box>
          )}
        </>
      )}
    </Root>
  )
}
