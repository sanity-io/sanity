import React from 'react'
import {Box, Flex, rem, Stack, Text, TextSkeleton} from '@sanity/ui'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {PreviewMediaDimensions} from '../types'
import {Media} from '../_common/Media'
import {PREVIEW_MEDIA_SIZE} from '../constants'

export interface TemplatePreviewProps {
  description?: React.ReactNode | React.FunctionComponent<unknown>
  isPlaceholder?: boolean
  media?: React.ReactNode | React.FunctionComponent<unknown>
  mediaDimensions?: PreviewMediaDimensions
  subtitle?: React.ReactNode | React.FunctionComponent<{layout: 'default'}>
  title?: React.ReactNode | React.FunctionComponent<unknown>
}

const DEFAULT_MEDIA_DIMENSION: PreviewMediaDimensions = {
  ...PREVIEW_MEDIA_SIZE.default,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

const Root = styled(Box)`
  height: 100%;

  a {
    color: currentColor;
    text-decoration: none;
  }

  svg[data-sanity-icon] {
    margin: 0;
  }
`

const HeaderFlex = styled(Flex).attrs({align: 'center'})`
  height: ${rem(PREVIEW_MEDIA_SIZE.default.height)};
`

const TitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1})`
  max-width: ${rem(160)};
  width: 80%;
`

const SubtitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1, size: 1})`
  max-width: ${rem(120)};
  width: 60%;
`

export function TemplatePreview(props: TemplatePreviewProps) {
  const {
    description,
    isPlaceholder,
    media,
    mediaDimensions = DEFAULT_MEDIA_DIMENSION,
    subtitle,
    title = 'Untitled',
  } = props

  if (isPlaceholder) {
    return (
      <Root>
        <HeaderFlex>
          <Stack flex={1} space={2}>
            <TitleSkeleton />
            <SubtitleSkeleton />
          </Stack>
        </HeaderFlex>
      </Root>
    )
  }

  return (
    <Root>
      <HeaderFlex>
        <Stack flex={1} space={2}>
          <Text textOverflow="ellipsis">
            {typeof title !== 'function' && title}
            {typeof title === 'function' && title({layout: 'default'})}
          </Text>

          {subtitle && (
            <Text muted size={1} textOverflow="ellipsis">
              {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
            </Text>
          )}
        </Stack>

        {media && (
          <Flex align="flex-start" paddingLeft={2}>
            <Media dimensions={mediaDimensions} layout="default" media={media} />
          </Flex>
        )}
      </HeaderFlex>

      {description && (
        <Box marginTop={3}>
          <Text muted size={1} style={{whiteSpace: 'break-spaces'}}>
            {description}
          </Text>
        </Box>
      )}
    </Root>
  )
}
