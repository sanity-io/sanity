import React from 'react'
import {Box, Flex, Stack, Text, Skeleton, TextSkeleton, rem} from '@sanity/ui'
import classNames from 'classnames'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {Media} from '../_common/Media'
import {PREVIEW_MEDIA_SIZE} from '../constants'
import {PreviewMediaDimensions, PreviewProps} from '../types'
import {renderPreviewNode} from '../helpers'

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
  ...PREVIEW_MEDIA_SIZE.default,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

const Root = styled(Flex)`
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

/**
 * @hidden
 * @beta */
export function DefaultPreview(props: DefaultPreviewProps) {
  const {title, subtitle, media, status, isPlaceholder, children, styles} = props
  const rootClassName = classNames(styles?.root, Boolean(subtitle) && styles?.hasSubtitle)

  const statusNode = status && (
    <Box
      className={styles?.status}
      data-testid="default-preview__status"
      paddingLeft={3}
      paddingRight={1}
    >
      {renderPreviewNode(status, 'default')}
    </Box>
  )

  if (isPlaceholder) {
    return (
      <Root align="center" className={styles?.placeholder} data-testid="default-preview">
        {media !== false && (
          <Skeleton animated marginRight={2} radius={2} style={PREVIEW_MEDIA_SIZE.default} />
        )}

        <Stack
          data-testid="default-preview__heading"
          flex={1}
          paddingLeft={media === false ? 1 : 2}
          paddingRight={status ? 0 : 1}
          space={2}
        >
          <TitleSkeleton />
          <SubtitleSkeleton />
        </Stack>

        {statusNode}
      </Root>
    )
  }

  return (
    <Root align="center" className={rootClassName} data-testid="default-preview">
      {media !== false && media !== undefined && (
        <Media
          dimensions={DEFAULT_MEDIA_DIMENSIONS}
          layout="default"
          media={media as any}
          styles={styles}
        />
      )}

      <Stack
        className={styles?.heading}
        data-testid="default-preview__header"
        flex={1}
        paddingLeft={media ? 2 : 1}
        paddingRight={status ? 0 : 1}
        space={2}
      >
        <Text
          className={styles?.title}
          size={1}
          style={{color: 'inherit'}}
          textOverflow="ellipsis"
          weight="medium"
        >
          {title && renderPreviewNode(title, 'default')}
          {!title && <span style={{color: 'var(--card-muted-fg-color)'}}>Untitled</span>}
        </Text>

        {subtitle && (
          <Text muted size={1} textOverflow="ellipsis" className={styles?.subtitle}>
            {renderPreviewNode(subtitle, 'default')}
          </Text>
        )}

        {children && <div className={styles?.children}>{children}</div>}
      </Stack>

      {statusNode}
    </Root>
  )
}
