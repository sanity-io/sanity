import {Box, Flex, Skeleton, Stack, Text, TextSkeleton} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../i18n'
import {Media} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {renderPreviewNode} from '../helpers'
import {type PreviewMediaDimensions, type PreviewProps} from '../types'
import * as styles from './DetailPreview.css'

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
    <Box className={styles.statusBoxStyle} marginLeft={3} paddingRight={1}>
      {renderPreviewNode(status, 'detail')}
    </Box>
  )

  if (isPlaceholder) {
    return (
      <Flex
        align="center"
        className={styles.rootFlexStyle}
        data-testid="detail-preview"
        paddingLeft={media ? 2 : 3}
        paddingRight={2}
        paddingY={2}
      >
        <Flex align="center" flex={1} gap={3}>
          {media && (
            <Skeleton
              animated
              className={styles.mediaSkeletonStyle}
              data-testid="detail-preview__media"
              radius={2}
            />
          )}

          <Flex align="center" data-testid="detail-preview__header" flex={1}>
            <Stack flex={1} gap={2}>
              <TextSkeleton animated className={styles.titleSkeletonStyle} radius={1} size={1} />
              <TextSkeleton animated className={styles.subtitleSkeletonStyle} radius={1} size={1} />
              {description && (
                <Box marginTop={1}>
                  <TextSkeleton
                    animated
                    className={styles.descriptionSkeletonStyle}
                    radius={1}
                    size={1}
                  />
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
      align="center"
      className={styles.rootFlexStyle}
      data-testid="detail-preview"
      paddingLeft={media ? 2 : 3}
      paddingRight={2}
      paddingY={2}
    >
      <Flex align="center" flex={1} gap={3}>
        {media && <Media dimensions={mediaDimensions} layout="detail" media={media as any} />}

        <Flex align="center" data-testid="detail-preview__header" flex={1}>
          <Stack flex={1} gap={2}>
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
                <Text className={styles.descriptionTextStyle} muted size={1}>
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
