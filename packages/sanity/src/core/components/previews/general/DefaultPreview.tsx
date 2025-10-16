import {Box, Flex, Skeleton, Stack, Text, TextSkeleton} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import classNames from 'classnames'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../i18n'
import {Media} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {renderPreviewNode} from '../helpers'
import {type PreviewMediaDimensions, type PreviewProps} from '../types'
import * as defaultStyles from './DefaultPreview.css'

/**
 * @hidden
 * @beta */
export interface DefaultPreviewProps extends Omit<PreviewProps<'default'>, 'renderDefault'> {
  styles?: {
    root?: string
    placeholder?: string
    media?: string
    heading?: string
    title?: string
    subtitle?: string
    hasSubtitle?: string
    mediaString?: string
    status?: string
    children?: string
  }
}

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_SIZES.default.media,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

const SKELETON_DELAY = 300
/**
 * @hidden
 * @beta */
export function DefaultPreview(props: DefaultPreviewProps) {
  const {title, subtitle, media, status, isPlaceholder, children, styles} = props
  const {t} = useTranslation()
  const rootClassName = classNames(styles?.root, Boolean(subtitle) && styles?.hasSubtitle)

  const statusNode = status && (
    <Box className={styles?.status} data-testid="default-preview__status">
      {renderPreviewNode(status, 'default')}
    </Box>
  )

  if (isPlaceholder) {
    return (
      <Flex
        align="center"
        className={classNames(defaultStyles.rootStyle, styles?.placeholder)}
        data-testid="default-preview"
        padding={2}
        paddingLeft={media ? 2 : 3}
      >
        <Flex align="center" flex={1} gap={2}>
          {media && (
            <Box flex="none">
              <Skeleton
                animated
                delay={SKELETON_DELAY}
                radius={1}
                style={PREVIEW_SIZES.default.media}
              />
            </Box>
          )}

          <Stack data-testid="default-preview__heading" flex={1} gap={2}>
            <TextSkeleton
              animated
              className={defaultStyles.titleSkeletonStyle}
              delay={SKELETON_DELAY}
              radius={1}
              size={1}
            />
            <TextSkeleton
              animated
              className={defaultStyles.subtitleSkeletonStyle}
              delay={SKELETON_DELAY}
              radius={1}
              size={1}
            />
          </Stack>

          <Box flex="none" padding={1}>
            {statusNode}
          </Box>
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex
      align="center"
      className={classNames(defaultStyles.rootStyle, rootClassName)}
      data-testid="default-preview"
      padding={2}
      paddingLeft={media ? 2 : 3}
    >
      <Flex align="center" flex={1} gap={2}>
        {media && (
          <Box flex="none">
            <Media
              dimensions={DEFAULT_MEDIA_DIMENSIONS}
              layout="default"
              media={media as any}
              styles={styles}
            />
          </Box>
        )}

        <Stack className={styles?.heading} data-testid="default-preview__header" flex={1} gap={2}>
          <Text
            className={styles?.title}
            size={1}
            style={{color: 'inherit'}}
            textOverflow="ellipsis"
            weight="medium"
          >
            {title && renderPreviewNode(title, 'default')}
            {!title && (
              <span style={{color: vars.color.muted.fg}}>
                {t('preview.default.title-fallback')}
              </span>
            )}
          </Text>

          {subtitle && (
            <Text muted size={1} textOverflow="ellipsis" className={styles?.subtitle}>
              {renderPreviewNode(subtitle, 'default')}
            </Text>
          )}
        </Stack>

        <Box flex="none" padding={1}>
          {statusNode}
        </Box>

        {children && <div className={styles?.children}>{children}</div>}
      </Flex>
    </Flex>
  )
}
