import {Box, Flex, Stack, Text, TextSkeleton} from '@sanity/ui'
import {type ElementType, isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {Media, type MediaProps} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {type PreviewMediaDimensions} from '../types'
import * as styles from './TemplatePreview.css'

/**
 * @hidden
 * @beta */
export interface TemplatePreviewProps {
  description?: ReactNode
  isPlaceholder?: boolean
  media?: MediaProps['media']
  mediaDimensions?: PreviewMediaDimensions
  subtitle?: ElementType<{layout: 'default'}> | ReactNode
  title?: ElementType<{layout: 'default'}> | ReactNode
}

const DEFAULT_MEDIA_DIMENSION: PreviewMediaDimensions = {
  ...PREVIEW_SIZES.default.media,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

/**
 * @hidden
 * @beta */
export function TemplatePreview(props: TemplatePreviewProps) {
  const {
    description,
    isPlaceholder,
    media,
    mediaDimensions = DEFAULT_MEDIA_DIMENSION,
    subtitle: Subtitle,
    title: Title = 'Untitled',
  } = props

  if (isPlaceholder) {
    return (
      <Box className={styles.rootStyle}>
        <Flex align="center" className={styles.headerFlexStyle}>
          <Stack flex={1} gap={2}>
            <TextSkeleton animated className={styles.titleSkeletonStyle} radius={1} />
            <TextSkeleton animated className={styles.subtitleSkeletonStyle} radius={1} size={1} />
          </Stack>
        </Flex>
      </Box>
    )
  }

  return (
    <Box className={styles.rootStyle}>
      <Flex align="center" className={styles.headerFlexStyle}>
        <Stack flex={1} gap={2}>
          {isValidElementType(Title) && (
            <Text textOverflow="ellipsis">
              <Title layout="default" />
            </Text>
          )}
          {isValidElement(Title) && <Text textOverflow="ellipsis">{Title}</Text>}

          {isValidElementType(Subtitle) && (
            <Text muted size={1} textOverflow="ellipsis">
              <Subtitle layout="default" />
            </Text>
          )}
          {isValidElement(Subtitle) && (
            <Text muted size={1} textOverflow="ellipsis">
              {Subtitle}
            </Text>
          )}
        </Stack>

        {media && (
          <Flex align="flex-start" paddingLeft={2}>
            <Media dimensions={mediaDimensions} layout="default" media={media} />
          </Flex>
        )}
      </Flex>

      {description && (
        <Box marginTop={3}>
          <Text muted size={1} style={{whiteSpace: 'break-spaces'}}>
            {description}
          </Text>
        </Box>
      )}
    </Box>
  )
}
