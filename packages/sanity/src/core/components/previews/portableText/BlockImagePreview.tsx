import {Box, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {Media} from '../_common/Media'
import {PREVIEW_MEDIA_SIZE} from '../constants'
import {PreviewMediaDimensions, PreviewProps} from '../types'
import {renderPreviewNode} from '../helpers'
import {HeaderFlex, MediaCard, RootBox} from './BlockImagePreview.styled'

/**
 * @hidden
 * @beta */
export type BlockImagePreviewProps = Omit<PreviewProps<'blockImage'>, 'renderDefault'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_MEDIA_SIZE.blockImage,
  fit: 'fillmax',
  dpr: getDevicePixelRatio(),
}

const getRatio = (dimensions: PreviewMediaDimensions) => {
  const {height, width} = dimensions

  if (!height || !width) {
    return 1
  }

  return (height / width) * 100
}

/**
 * @hidden
 * @beta */
export function BlockImagePreview(props: BlockImagePreviewProps) {
  const {
    actions,
    title,
    subtitle,
    description,
    fallbackTitle = 'Untitled',
    mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
    media,
    children,
    status,
  } = props

  return (
    <RootBox>
      <Stack>
        <HeaderFlex paddingLeft={2} paddingRight={1} paddingY={1}>
          <Stack flex={1} space={2}>
            {(title || fallbackTitle) && (
              <Text size={1} textOverflow="ellipsis" weight="semibold">
                {title ? renderPreviewNode(title as any, 'block') : fallbackTitle}
              </Text>
            )}

            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {renderPreviewNode(subtitle as any, 'block')}
              </Text>
            )}
          </Stack>

          <Flex gap={1} paddingLeft={1}>
            {status && (
              <Box paddingX={2} paddingY={3}>
                {renderPreviewNode(status as any, 'block')}
              </Box>
            )}

            {actions as any}
          </Flex>
        </HeaderFlex>

        <MediaCard
          $ratio={getRatio(mediaDimensions)}
          __unstable_checkered
          display="flex"
          sizing="border"
          tone="inherit"
        >
          <Media
            border={false}
            dimensions={mediaDimensions}
            layout="blockImage"
            media={media as any}
            radius={0}
            responsive
          />
        </MediaCard>
      </Stack>

      {description && (
        <Box paddingX={2} paddingY={3}>
          <Text muted size={1}>
            {renderPreviewNode(description as any, 'block')}
          </Text>
        </Box>
      )}

      {children && <div>{children}</div>}
    </RootBox>
  )
}
