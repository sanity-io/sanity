import {Box, Flex, rem, Skeleton, Text, TextSkeleton} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {PREVIEW_SIZES} from '../constants'

export const RootFlex = styled(Flex).attrs({align: 'center'})`
  height: ${rem(PREVIEW_SIZES.detail.media.height)};
`

export const StatusBox = styled(Box)`
  white-space: nowrap;
`

export const MediaSkeleton = styled(Skeleton).attrs({animated: true, radius: 2})`
  width: ${rem(PREVIEW_SIZES.detail.media.width)};
  height: ${rem(PREVIEW_SIZES.detail.media.height)};
`

export const TitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1, size: 1})`
  max-width: ${rem(160)}; /* 80% of 200px */
  width: 80%;
`

export const SubtitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1, size: 1})`
  max-width: ${rem(120)}; /* 60% of 200px */
  width: 60%;
`

export const DescriptionSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1, size: 1})`
  max-width: ${rem(180)}; /* 90% of 200px */
  width: 90%;
`

export const DescriptionText = styled(Text)(({theme}) => {
  const {fonts} = theme.sanity
  const textSize1 = fonts.text.sizes[1]
  const maxLines = 2
  const maxHeight = textSize1.lineHeight * maxLines

  return css`
    & > span {
      max-height: ${rem(maxHeight)};

      /* Multi-line text overflow */
      display: -webkit-box;
      overflow: hidden;
      overflow: clip;
      text-overflow: ellipsis;
      -webkit-line-clamp: ${maxLines};
      -webkit-box-orient: vertical;
    }
  `
})
