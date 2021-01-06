/* eslint-disable react/no-unused-prop-types */

import {Box, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {PreviewMediaDimensions} from './types'

type DefaultPreviewNode<T> = React.ReactNode | React.FC<T>

interface DefaultPreviewProps {
  description?: React.ReactNode
  extendedPreview?: unknown
  icon?: boolean
  isPlaceholder?: boolean
  media?: DefaultPreviewNode<{dimensions: PreviewMediaDimensions; layout: 'default'}>
  progress?: unknown
  status?: DefaultPreviewNode<{layout: 'default'}>
  subtitle?: DefaultPreviewNode<{layout: 'default'}>
  title?: DefaultPreviewNode<{layout: 'default'}>
  type?: unknown
  value?: {
    _hasDraft: boolean
    _hasPublished: boolean
    _id: string
    _type: string
    title: string
  }
}

function renderPreviewNode<T>(
  previewNode: DefaultPreviewNode<T>,
  props: T
): React.ReactElement | null {
  if (typeof previewNode === 'function') {
    return previewNode(props)
  }

  if (previewNode === undefined || previewNode === null || previewNode === '') {
    return null
  }

  return <>{previewNode}</>
}

const MediaBox = styled(Box)`
  position: relative;
  width: 39px;
  height: 39px;
  align-items: center;
  justify-content: center;

  & > svg {
    display: block;

    &:not([data-sanity-icon]) {
      font-size: 23px;
    }

    &[data-sanity-icon] {
      font-size: 35px;
    }
  }

  & > img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const CappedSpan = styled.span`
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  width: 80,
  height: 80,
  aspect: 1,
  fit: 'crop',
}

export function DefaultPreview(props: DefaultPreviewProps) {
  const {media: mediaNode, title: titleNode, status: statusNode, subtitle: subtitleNode} = props
  const media = renderPreviewNode(mediaNode, {
    layout: 'default',
    dimensions: DEFAULT_MEDIA_DIMENSIONS,
  })
  const title = renderPreviewNode(titleNode, {layout: 'default'})
  const subtitle = renderPreviewNode(subtitleNode, {layout: 'default'})
  const status = renderPreviewNode(statusNode, {layout: 'default'})

  return (
    <Flex align="center">
      {media && (
        <MediaBox display="flex" marginRight={2} overflow="hidden">
          {media}
        </MediaBox>
      )}

      <Stack flex={1} space={2}>
        {title && (
          <Text weight="medium">
            <CappedSpan>{title}</CappedSpan>
          </Text>
        )}

        {!title && <Text muted>Untitled</Text>}

        {subtitle && (
          <Text muted size={1}>
            <CappedSpan>{subtitle}</CappedSpan>
          </Text>
        )}
      </Stack>

      {status && <Box marginLeft={3}>{status}</Box>}
    </Flex>
  )
}
