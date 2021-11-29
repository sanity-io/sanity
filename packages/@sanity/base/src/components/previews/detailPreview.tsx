import React from 'react'
import {Box, Stack, Text, Skeleton, TextSkeleton, useTheme} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import type {MediaDimensions, PreviewProps} from './types'
import {
  Root,
  Top,
  Content,
  Header,
  StatusWrapper,
  MediaWrapper,
  MediaString,
} from './detailPreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 80,
  height: 80,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

export const DetailPreview: React.FunctionComponent<PreviewProps<'detail'>> = (props) => {
  const {
    title,
    subtitle,
    description,
    mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
    media,
    status,
    children,
    isPlaceholder,
  } = props
  const {fonts} = useTheme().sanity
  const textSize = fonts.text.sizes[1]
  const maxHeight = textSize.lineHeight * 2 - textSize.ascenderHeight - textSize.descenderHeight

  if (isPlaceholder) {
    return (
      <Root align="center">
        <Skeleton style={{width: 80, height: 80}} radius={2} marginRight={2} animated />
        <Stack space={2} flex={1}>
          <TextSkeleton style={{maxWidth: 320}} radius={1} animated />
          <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated />
        </Stack>
      </Root>
    )
  }

  return (
    <Root align="center">
      {media !== false && (
        <MediaWrapper align="center" justify="center" marginRight={2}>
          {typeof media === 'function' &&
            media({
              dimensions: mediaDimensions,
              layout: 'detail',
            })}
          {typeof media === 'string' && <MediaString>{media}</MediaString>}
          {React.isValidElement(media) && media}
        </MediaWrapper>
      )}
      <Content justify="center" direction="column">
        <Top align="center" justify="space-between">
          <Header space={2} flex={1}>
            <Text textOverflow="ellipsis" style={{color: 'inherit'}}>
              {title && typeof title === 'function' ? title({layout: 'detail'}) : title}
              {!title && <>Untitled</>}
            </Text>

            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {typeof subtitle === 'function' ? subtitle({layout: 'detail'}) : subtitle}
              </Text>
            )}
          </Header>
          {status && (
            <StatusWrapper paddingLeft={1}>
              {typeof status === 'function' ? status({layout: 'detail'}) : status}
            </StatusWrapper>
          )}
        </Top>
        {description && (
          <Box marginTop={3} overflow="hidden" style={{maxHeight}}>
            <Text muted size={1}>
              {typeof description === 'function' ? description({layout: 'detail'}) : description}
            </Text>
          </Box>
        )}
      </Content>
      {children}
    </Root>
  )
}
