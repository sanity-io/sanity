import React from 'react'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {Media} from '../_common/Media'
import {PREVIEW_MEDIA_SIZE} from '../constants'
import {PreviewMediaDimensions, PreviewProps} from '../types'
import {
  DescriptionSkeleton,
  DescriptionText,
  MediaSkeleton,
  RootFlex,
  StatusBox,
  SubtitleSkeleton,
  TitleSkeleton,
} from './DetailPreview.styled'

export type DetailPreviewProps = PreviewProps<'detail'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_MEDIA_SIZE.detail,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

export function DetailPreview(props: DetailPreviewProps) {
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

  const statusNode = status && (
    <StatusBox marginLeft={3} paddingRight={1}>
      {typeof status === 'function' ? status({layout: 'detail'}) : status}
    </StatusBox>
  )

  if (isPlaceholder) {
    return (
      <RootFlex data-testid="detail-preview">
        {media !== false && <MediaSkeleton data-testid="detail-preview__media" />}

        <Box flex={1} paddingLeft={media === false ? 1 : 2}>
          <Flex align="center" data-testid="detail-preview__header">
            <Stack flex={1} space={2}>
              <TitleSkeleton />
              <SubtitleSkeleton />
            </Stack>

            {statusNode}
          </Flex>

          {description && (
            <Box marginTop={3}>
              <DescriptionSkeleton />
            </Box>
          )}
        </Box>
      </RootFlex>
    )
  }

  return (
    <RootFlex data-testid="detail-preview">
      {media !== false && <Media dimensions={mediaDimensions} layout="detail" media={media} />}

      <Box flex={1} paddingLeft={media === false ? 1 : 2}>
        <Flex align="center" data-testid="detail-preview__header">
          <Stack flex={1} space={2}>
            <Text textOverflow="ellipsis" style={{color: 'inherit'}}>
              {title && typeof title === 'function' ? title({layout: 'detail'}) : title}
              {!title && <>Untitled</>}
            </Text>

            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {typeof subtitle === 'function' ? subtitle({layout: 'detail'}) : subtitle}
              </Text>
            )}
          </Stack>

          {statusNode}
        </Flex>

        {description && (
          <Box marginTop={3}>
            <DescriptionText muted size={1}>
              {typeof description === 'function' ? description({layout: 'detail'}) : description}
            </DescriptionText>
          </Box>
        )}
      </Box>

      {children}
    </RootFlex>
  )
}
