import React, {useMemo} from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {Text, Tooltip} from '@sanity/ui'
import {CircularProgress} from '../../progress'
import {Media} from '../_common/Media'
import {PREVIEW_MEDIA_SIZE} from '../constants'
import {PreviewMediaDimensions, PreviewProps} from '../types'
import {
  MediaSkeleton,
  MediaFlex,
  ProgressFlex,
  RootBox,
  TooltipContentStack,
} from './MediaPreview.styled'

interface MediaPreviewProps extends PreviewProps<'media'> {
  withRadius?: boolean
  withBorder?: boolean
}

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_MEDIA_SIZE.media,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

export function MediaPreview(props: MediaPreviewProps) {
  const {
    media,
    mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
    children,
    isPlaceholder,
    progress = -1,
    subtitle,
    title,
    withBorder = true,
    withRadius = true,
    ...restProps
  } = props

  const aspect = mediaDimensions.aspect

  const STYLES_PADDER = useMemo(() => ({paddingBottom: `${100 / aspect}%`}), [aspect])

  const tooltipContent = useMemo(() => {
    if (!title || !subtitle) {
      return null
    }

    return (
      <TooltipContentStack>
        {title && (
          <Text align="center" size={1} weight="semibold">
            {typeof title === 'function' ? title({layout: 'media'}) : title}
          </Text>
        )}

        {subtitle && (
          <Text align="center" size={1}>
            {typeof subtitle === 'function' ? subtitle({layout: 'media'}) : subtitle}
          </Text>
        )}
      </TooltipContentStack>
    )
  }, [subtitle, title])

  return (
    <RootBox data-testid="media-preview" overflow="hidden" flex={1} {...restProps}>
      <div style={STYLES_PADDER} />

      <Tooltip content={tooltipContent} disabled={!tooltipContent} placement="top" portal>
        <MediaFlex>
          {isPlaceholder ? (
            <MediaSkeleton />
          ) : (
            <Media
              border={withBorder}
              dimensions={mediaDimensions}
              layout="media"
              media={media}
              radius={withRadius ? 2 : 0}
              responsive
            />
          )}

          {typeof progress === 'number' && progress > -1 && (
            <ProgressFlex>
              <CircularProgress value={progress} />
            </ProgressFlex>
          )}
        </MediaFlex>
      </Tooltip>

      {children}
    </RootBox>
  )
}
