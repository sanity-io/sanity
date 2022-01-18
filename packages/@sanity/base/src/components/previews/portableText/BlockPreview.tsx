import {Box, Flex, rem, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {Media} from '../_common/Media'
import {PREVIEW_MEDIA_SIZE} from '../constants'
import {PreviewMediaDimensions, PreviewProps} from '../types'

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_MEDIA_SIZE.block,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

const HeaderFlex = styled(Flex).attrs({align: 'center'})`
  min-height: ${rem(PREVIEW_MEDIA_SIZE.block.height)};
`

export function BlockPreview(props: PreviewProps<'block'>) {
  const {
    actions,
    title,
    subtitle,
    description,
    mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
    media,
    status,
    children,
    extendedPreview,
  } = props

  return (
    <Stack data-testid="block-preview" space={1}>
      <HeaderFlex data-testid="block-preview__header">
        {media && <Media dimensions={mediaDimensions} layout="block" media={media} />}

        <Box flex={1} paddingLeft={media ? 2 : 1}>
          <Text size={1} textOverflow="ellipsis" weight="semibold">
            {title && typeof title === 'function' ? title({layout: 'block'}) : title}
            {!title && <>Untitled</>}
          </Text>

          {subtitle && (
            <Box marginTop={2}>
              <Text muted size={1} textOverflow="ellipsis">
                {typeof subtitle === 'function' ? subtitle({layout: 'block'}) : subtitle}
              </Text>
            </Box>
          )}

          {description && (
            <Box marginTop={3}>
              <Text muted size={1} textOverflow="ellipsis">
                {typeof description === 'function' ? description({layout: 'block'}) : description}
              </Text>
            </Box>
          )}
        </Box>

        <Flex gap={1} paddingLeft={1}>
          {status && (
            <Box paddingX={2} paddingY={3}>
              {typeof status === 'function' ? status({layout: 'block'}) : status}
            </Box>
          )}

          {actions}
        </Flex>
      </HeaderFlex>

      {children && <div data-testid="block-preview__children">{children}</div>}

      {extendedPreview && <div data-testid="block-preview__extended">{extendedPreview}</div>}
    </Stack>
  )
}
