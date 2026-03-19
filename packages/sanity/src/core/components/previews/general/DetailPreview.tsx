import {Box, Flex, Skeleton, Stack, Text, TextSkeleton, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../i18n'
import {Media} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {renderPreviewNode} from '../helpers'
import {type PreviewMediaDimensions, type PreviewProps} from '../types'
import {
  descriptionSkeleton,
  descriptionText,
  maxHeightVar,
  mediaSkeleton,
  rootFlex,
  statusBox,
  subtitleSkeleton,
  titleSkeleton,
} from './DetailPreview.css'

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
  const {font} = useThemeV2()

  const textSize1 = font.text.sizes[1]
  const maxLines = 2
  const maxHeight = textSize1.lineHeight * maxLines

  const statusNode = status && (
    <Box className={statusBox} marginLeft={3} paddingRight={1}>
      {renderPreviewNode(status, 'detail')}
    </Box>
  )

  if (isPlaceholder) {
    return (
      <Flex
        className={rootFlex}
        align="center"
        data-testid="detail-preview"
        paddingLeft={media ? 2 : 3}
        paddingRight={2}
        paddingY={2}
      >
        <Flex align="center" flex={1} gap={3}>
          {media && (
            <Skeleton
              className={mediaSkeleton}
              animated
              radius={2}
              data-testid="detail-preview__media"
            />
          )}

          <Flex align="center" data-testid="detail-preview__header" flex={1}>
            <Stack flex={1} space={2}>
              <TextSkeleton className={titleSkeleton} animated radius={1} size={1} />
              <TextSkeleton className={subtitleSkeleton} animated radius={1} size={1} />
              {description && (
                <Box marginTop={1}>
                  <TextSkeleton className={descriptionSkeleton} animated radius={1} size={1} />
                </Box>
              )}
            </Stack>
          </Flex>

          {statusNode}
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex
      className={rootFlex}
      align="center"
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
                <Text
                  className={descriptionText}
                  muted
                  size={1}
                  style={assignInlineVars({
                    [maxHeightVar]: `${maxHeight}px`,
                  })}
                >
                  {renderPreviewNode(description, 'detail')}
                </Text>
              </Box>
            )}
          </Stack>

          {statusNode}
        </Flex>

        {children}
      </Flex>
    </Flex>
  )
}
