/* eslint-disable react/no-unused-prop-types */

import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {renderPreviewNode} from '../helpers'
import {PreviewMediaDimensions, PreviewNode} from '../types'

interface DefaultPreviewProps {
  description?: PreviewNode<{layout: 'default'}>
  extendedPreview?: unknown
  icon?: boolean
  isPlaceholder?: boolean
  media?: PreviewNode<{dimensions: PreviewMediaDimensions; layout: 'default'}>
  progress?: unknown
  status?: PreviewNode<{layout: 'default'}>
  subtitle?: PreviewNode<{layout: 'default'}>
  title?: PreviewNode<{layout: 'default'}>
  type?: unknown
  value?: {
    _hasDraft: boolean
    _hasPublished: boolean
    _id: string
    _type: string
    title: string
  }
}

const PREVIEW_SIZE = 35

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  width: PREVIEW_SIZE * 2,
  height: PREVIEW_SIZE * 2,
  aspect: 1,
  fit: 'crop',
}

const MediaBox = styled(Box)`
  position: relative;
  width: ${PREVIEW_SIZE}px;
  height: ${PREVIEW_SIZE}px;
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
    border-radius: 3px;
  }

  &:empty {
    display: none;
  }
`

const CappedSpan = styled.span`
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export function DefaultPreview(props: DefaultPreviewProps) {
  const {
    isPlaceholder,
    media: mediaNode,
    title: titleNode,
    status: statusNode,
    subtitle: subtitleNode,
  } = props

  if (isPlaceholder) {
    return (
      <Flex align="center" style={{height: PREVIEW_SIZE}}>
        <MediaBox display="flex" marginRight={2} overflow="hidden">
          <Card radius={2} tone="transparent" style={{width: '100%', height: '100%'}} />
        </MediaBox>
        <Stack flex={1} space={2}>
          <Card radius={1} style={{height: 11, width: '50%'}} tone="transparent" />
          <Card radius={1} style={{height: 9, width: '40%'}} tone="transparent" />
        </Stack>
      </Flex>
    )
  }

  const media = renderPreviewNode(mediaNode, {
    layout: 'default',
    dimensions: DEFAULT_MEDIA_DIMENSIONS,
  })
  const title = renderPreviewNode(titleNode, {layout: 'default'})
  const subtitle = renderPreviewNode(subtitleNode, {layout: 'default'})
  const status = renderPreviewNode(statusNode, {layout: 'default'})

  return (
    <Flex align="center" style={{height: PREVIEW_SIZE}}>
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
