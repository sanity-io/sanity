import {Box, Flex, rem, Skeleton, Stack, Text, TextSkeleton} from '@sanity/ui'
import classNames from 'classnames'
import {useMemo} from 'react'
import {styled} from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../i18n'
import {Media} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {renderPreviewNode} from '../helpers'
import {type PreviewMediaDimensions, type PreviewProps} from '../types'

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

const Root = styled(Flex)`
  height: ${rem(PREVIEW_SIZES.default.media.height)};
  box-sizing: content-box;
`

const TitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1, size: 1})`
  max-width: ${rem(160)};
  width: 80%;
`

const SubtitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1, size: 1})`
  max-width: ${rem(120)};
  width: 60%;
`
const SKELETON_DELAY = 300
/**
 * @hidden
 * @beta */
export function DefaultPreview(props: DefaultPreviewProps) {
  const {title, subtitle, media, status, isPlaceholder, children, styles} = props
  const {t} = useTranslation()
  const rootClassName = classNames(styles?.root, Boolean(subtitle) && styles?.hasSubtitle)

  const statusNode = useMemo(
    () =>
      status && (
        <Box className={styles?.status} data-testid="default-preview__status">
          {renderPreviewNode(status, 'default')}
        </Box>
      ),
    [status, styles?.status],
  )

  const memoizedStatusBox = useMemo(
    () => (
      <Box flex="none" padding={1}>
        {statusNode}
      </Box>
    ),
    [statusNode],
  )
  const memoizedMediaBox = useMemo(
    () =>
      media && (
        <Box flex="none">
          <Media
            dimensions={DEFAULT_MEDIA_DIMENSIONS}
            layout="default"
            media={media as any}
            styles={styles}
          />
        </Box>
      ),
    [media, styles],
  )

  if (isPlaceholder) {
    return (
      <Root
        align="center"
        className={styles?.placeholder}
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

          <Stack data-testid="default-preview__heading" flex={1} space={2}>
            <TitleSkeleton delay={SKELETON_DELAY} />
            <SubtitleSkeleton delay={SKELETON_DELAY} />
          </Stack>

          {memoizedStatusBox}
        </Flex>
      </Root>
    )
  }

  return (
    <Root
      align="center"
      className={rootClassName}
      data-testid="default-preview"
      padding={2}
      paddingLeft={media ? 2 : 3}
    >
      <Flex align="center" flex={1} gap={2}>
        {memoizedMediaBox}

        <Stack className={styles?.heading} data-testid="default-preview__header" flex={1} space={2}>
          <Text
            className={styles?.title}
            size={1}
            style={{color: 'inherit'}}
            textOverflow="ellipsis"
            weight="medium"
          >
            {title && renderPreviewNode(title, 'default')}
            {!title && (
              <span style={{color: 'var(--card-muted-fg-color)'}}>
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

        {memoizedStatusBox}

        {children && <div className={styles?.children}>{children}</div>}
      </Flex>
    </Root>
  )
}
