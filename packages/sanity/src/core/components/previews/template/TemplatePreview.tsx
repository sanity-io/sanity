import {Box, Flex, rem, Stack, Text, TextSkeleton} from '@sanity/ui'
import {type ElementType, isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'
import {styled} from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {Media, type MediaProps} from '../_common/Media'
import {PREVIEW_SIZES} from '../constants'
import {type PreviewMediaDimensions} from '../types'

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
  height: ${rem(PREVIEW_SIZES.default.media.height)};
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
