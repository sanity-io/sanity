import React, {useMemo} from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {Box, Text} from '@sanity/ui'
import {Tooltip} from '../../../../ui'
import {CircularProgress} from '../../progress'
import {Media} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {PreviewMediaDimensions, PreviewProps} from '../types'
import {renderPreviewNode} from '../helpers'
import {
  MediaSkeleton,
  MediaFlex,
  ProgressFlex,
  RootBox,
  TooltipContentStack,
} from './MediaPreview.styled'

/**
 * @hidden
 * @beta */
export type MediaPreviewProps = Omit<PreviewProps<'media'>, 'renderDefault'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_SIZES.media.media,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

/**
 * @hidden
 * @beta */
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
  } = props

  const aspect = mediaDimensions.aspect || 1

  const STYLES_PADDER = useMemo(() => ({paddingBottom: `${100 / aspect}%`}), [aspect])

  const tooltipContent = useMemo(() => {
    if (!title || !subtitle) {
      return null
    }

    return (
      <TooltipContentStack>
        {title && (
          <Text align="center" size={1} weight="medium">
            {renderPreviewNode(title, 'media')}
          </Text>
        )}

        {subtitle && (
          <Text align="center" muted size={1}>
            {renderPreviewNode(subtitle, 'media')}
          </Text>
        )}
      </TooltipContentStack>
    )
  }, [subtitle, title])

  return (
    <Box padding={2}>
      <RootBox data-testid="media-preview" flex={1} overflow="hidden">
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
                media={media as any}
                radius={withRadius ? 1 : 0}
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
    </Box>
  )
}
