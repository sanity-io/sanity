import React from 'react'
import {Box, Flex, Stack, Text, Skeleton, TextSkeleton} from '@sanity/ui'
import styled from 'styled-components'
import {PreviewProps} from './types'

const Root = styled(Flex)`
  height: 40px;
`

const MediaWrapper = styled(Flex)`
  position: relative;
  width: 2.5em;
  height: 2.5em;
  min-width: 2.5em;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-radius: ${({theme}) => theme.sanity.radius[2]}px;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    display: block;
    font-size: calc(24 / 16 * 1em);
    color: inherit;
  }

  svg[data-sanity-icon='true'] {
    font-size: calc(36 / 16 * 1em);
    margin: calc(6 / 36 * -1em);
  }
`

export const DefaultPreview = (props: PreviewProps<'default'>) => {
  const {title, subtitle, media, status, isPlaceholder, children} = props

  return (
    <Root align="center">
      {isPlaceholder && (
        <>
          <Skeleton style={{width: 40, height: 40}} radius={2} marginRight={3} animated />
          <Stack space={2} flex={1}>
            <TextSkeleton style={{maxWidth: 320}} radius={1} animated />
            <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated />
          </Stack>
        </>
      )}
      {!isPlaceholder && (
        <>
          {media !== false && media !== undefined && (
            <MediaWrapper align="center" justify="center" marginRight={3}>
              {typeof media === 'function' &&
                media({
                  dimensions: {width: 80, height: 80, aspect: 1, fit: 'crop'},
                  layout: 'default',
                })}

              {typeof media === 'string' && <div>{media}</div>}

              {React.isValidElement(media) && media}
            </MediaWrapper>
          )}

          <Stack space={2} flex={1}>
            <Text textOverflow="ellipsis" style={{color: 'inherit'}} as="h2">
              {title && (
                <>
                  {typeof title !== 'function' && title}
                  {typeof title === 'function' && title({layout: 'default'})}
                </>
              )}
              {!title && <>Untitled</>}
            </Text>

            {subtitle && (
              <Text
                size={1}
                muted
                textOverflow="ellipsis"
                style={{color: 'inherit', opacity: 0.75}}
                as="h3"
              >
                {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
              </Text>
            )}

            {children && <div>{children}</div>}
          </Stack>

          {status && (
            <Box marginLeft={3}>
              {(typeof status === 'function' && status({layout: 'default'})) || status}
            </Box>
          )}
        </>
      )}
    </Root>
  )
}
