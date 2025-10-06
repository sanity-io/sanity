import {Box, Flex, Skeleton, Stack, Text, TextSkeleton} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../i18n'
import {Media} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {renderPreviewNode} from '../helpers'
import {type PreviewMediaDimensions, type PreviewProps} from '../types'
import * as styles from './CompactPreview.css'

/**
 * @hidden
 * @beta */
export type CompactPreviewProps = Omit<PreviewProps<'compact'>, 'renderDefault'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_SIZES.compact.media,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

/**
 * @hidden
 * @beta */
export function CompactPreview(props: CompactPreviewProps) {
  const {children, isPlaceholder, media, status, title} = props

  const {t} = useTranslation()

  const statusNode = status && (
    <Box data-testid="compact-preview__status" paddingLeft={4} paddingRight={1}>
      {renderPreviewNode(status, 'compact')}
    </Box>
  )

  if (isPlaceholder) {
    return (
      <Flex
        className={styles.rootStyle}
        align="center"
        data-testid="default-preview"
        paddingLeft={media ? 1 : 2}
        paddingRight={2}
        paddingY={1}
      >
        <Flex align="center" flex={1} gap={2}>
          {media && <Skeleton animated radius={2} style={PREVIEW_SIZES.compact.media} />}

          <Stack data-testid="compact-preview__heading" flex={1} gap={2}>
            <TextSkeleton className={styles.titleSkeletonStyle} animated radius={1} size={1} />
          </Stack>

          {statusNode}
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex
      className={styles.rootStyle}
      align="center"
      data-testid="compact-preview"
      paddingLeft={media ? 1 : 2}
      paddingRight={2}
      paddingY={1}
    >
      <Flex align="center" flex={1} gap={2}>
        {media && (
          <Media
            border={false}
            dimensions={DEFAULT_MEDIA_DIMENSIONS}
            layout="compact"
            media={media as any}
          />
        )}
        <Stack data-testid="compact-preview__header" flex={1} gap={2}>
          <Text size={1} style={{color: 'inherit'}} textOverflow="ellipsis" weight="medium">
            {title && renderPreviewNode(title, 'compact')}
            {!title && (
              <span style={{color: vars.color.muted.fg}}>
                {t('preview.default.title-fallback')}
              </span>
            )}
          </Text>
        </Stack>

        {statusNode}
      </Flex>

      {children && <Box marginLeft={1}>{children}</Box>}
    </Flex>
  )
}
