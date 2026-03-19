import {Box, Card, Flex, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {Media} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {renderPreviewNode} from '../helpers'
import {type PreviewMediaDimensions, type PreviewProps} from '../types'
import {headerFlex, mediaCard, radiusVar, ratioVar, rootBox} from './BlockImagePreview.css'

/**
 * @hidden
 * @beta */
export type BlockImagePreviewProps = Omit<PreviewProps<'blockImage'>, 'renderDefault'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_SIZES.blockImage.media,
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

  const {radius} = useThemeV2()

  return (
    <Box
      className={rootBox}
      overflow="hidden"
      style={assignInlineVars({[radiusVar]: `${radius[1]}px`})}
    >
      <Stack>
        <Flex
          className={headerFlex}
          align="center"
          paddingBottom={3}
          paddingLeft={2}
          paddingRight={1}
          paddingTop={1}
        >
          <Stack flex={1} space={2}>
            {(title || fallbackTitle) && (
              <Text size={1} textOverflow="ellipsis" weight="medium">
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
        </Flex>

        <Card
          className={mediaCard}
          __unstable_checkered
          display="flex"
          sizing="border"
          radius={2}
          tone="inherit"
          style={assignInlineVars({[ratioVar]: `${getRatio(mediaDimensions)}%`})}
        >
          <Media
            border={false}
            dimensions={mediaDimensions}
            layout="blockImage"
            media={media as any}
            radius={0}
            responsive
          />
        </Card>
      </Stack>

      {description && (
        <Box paddingX={2} paddingY={3}>
          <Text muted size={1}>
            {renderPreviewNode(description as any, 'block')}
          </Text>
        </Box>
      )}

      {children && <div>{children}</div>}
    </Box>
  )
}
