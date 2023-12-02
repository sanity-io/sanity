import React from 'react'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {useTranslation} from '../../../i18n'
import {Media} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import type {PreviewMediaDimensions, PreviewProps} from '../types'
import {renderPreviewNode} from '../helpers'
import {
  DescriptionSkeleton,
  DescriptionText,
  MediaSkeleton,
  RootFlex,
  StatusBox,
  SubtitleSkeleton,
  TitleSkeleton,
} from './DetailPreview.styled'

/**
 * @hidden
 * @beta */
export type DetailPreviewProps = PreviewProps<'detail'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_SIZES.detail.media,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

/**
 * @hidden
 * @beta */
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
  const {t} = useTranslation()

  const statusNode = status && (
    <StatusBox marginLeft={3} paddingRight={1}>
      {renderPreviewNode(status, 'detail')}
    </StatusBox>
  )

  if (isPlaceholder) {
    return (
      <RootFlex
        data-testid="detail-preview"
        paddingLeft={media ? 2 : 3}
        paddingRight={2}
        paddingY={2}
      >
        <Flex align="center" flex={1} gap={3}>
          {media && <MediaSkeleton data-testid="detail-preview__media" />}

          <Flex align="center" data-testid="detail-preview__header" flex={1}>
            <Stack flex={1} space={2}>
              <TitleSkeleton />
              <SubtitleSkeleton />
              {description && (
                <Box marginTop={1}>
                  <DescriptionSkeleton />
                </Box>
              )}
            </Stack>
          </Flex>

          {statusNode}
        </Flex>
      </RootFlex>
    )
  }

  return (
    <RootFlex
      data-testid="detail-preview"
      paddingLeft={media ? 2 : 3}
      paddingRight={2}
      paddingY={2}
    >
      <Flex align="center" flex={1} gap={3}>
        {media && <Media dimensions={mediaDimensions} layout="detail" media={media as any} />}

        <Flex align="center" data-testid="detail-preview__header" flex={1}>
          <Stack flex={1} space={2}>
            <Text textOverflow="ellipsis" size={1} style={{color: 'inherit'}} weight="medium">
              {title && renderPreviewNode(title, 'detail')}
              {!title && <>{t('preview.default.title-fallback')}</>}
            </Text>

            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {renderPreviewNode(subtitle, 'detail')}
              </Text>
            )}

            {description && (
              <Box marginTop={1}>
                <DescriptionText muted size={1}>
                  {renderPreviewNode(description, 'detail')}
                </DescriptionText>
              </Box>
            )}
          </Stack>

          {statusNode}
        </Flex>

        {children}
      </Flex>
    </RootFlex>
  )
}
