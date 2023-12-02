import {DocumentIcon, EditIcon} from '@sanity/icons'
import {Card, Container, Flex, Text} from '@sanity/ui'
import {useBoolean, useNumber, useSelect, useString, useText} from '@sanity/ui-workshop'
import React, {createElement, useMemo} from 'react'
import {GeneralPreviewLayoutKey, PreviewProps} from '../types'
import {CompactPreview} from '../general/CompactPreview'
import {DefaultPreview} from '../general/DefaultPreview'
import {DetailPreview} from '../general/DetailPreview'
import {MediaPreview} from '../general/MediaPreview'
import {PREVIEW_SIZES} from '../constants'

// Exclude deprecated layout mode
type LayoutKey = Exclude<GeneralPreviewLayoutKey, 'card'>

const MEDIA_OPTIONS: Record<string, 'none' | 'image' | 'icon' | 'text'> = {
  None: 'none',
  Image: 'image',
  Icon: 'icon',
  Text: 'text',
}

const LAYOUT_OPTIONS: Record<string, LayoutKey> = {
  Compact: 'compact',
  Default: 'default',
  Detail: 'detail',
  Media: 'media',
}

const previewComponents: {
  [TLayoutKey in LayoutKey]: React.ComponentType<PreviewProps<TLayoutKey>>
} = {
  compact: CompactPreview,
  default: DefaultPreview,
  detail: DetailPreview,
  media: MediaPreview,
}

export default function GeneralPreviewStory() {
  const layout = useSelect('Layout', LAYOUT_OPTIONS, 'compact')

  const isPlaceholder = useBoolean('Is placeholder', false)
  const interactive = useBoolean('Interactive', false)
  const mediaKey = useSelect('Media', MEDIA_OPTIONS) || 'none'
  const title = useString('Title', 'Title', 'Props')
  const subtitle = useString('Subtitle', 'Subtitle', 'Props')
  const description = useText('Description', 'Description', 'Props')
  const selected = useBoolean('Selected', false, 'Props')
  const status = useBoolean('Status', false)
  const progress = useNumber('Progress (%)', 50)

  const media = useMemo(() => {
    const {width, height} = layout ? PREVIEW_SIZES[layout].media : PREVIEW_SIZES.default.media

    if (mediaKey === 'image') {
      return <img src={`https://source.unsplash.com/${width * 2}x${height * 2}/?abstract`} />
    }

    if (mediaKey === 'icon') {
      return <DocumentIcon />
    }

    if (mediaKey === 'text') {
      return 'T'
    }

    return false
  }, [layout, mediaKey])

  const previewProps: Omit<PreviewProps, 'renderDefault' | 'schemaType'> = useMemo(
    () => ({
      description,
      isPlaceholder,
      media,
      progress,
      status: status && (
        <Text muted size={1}>
          <EditIcon />
        </Text>
      ),
      title,
      subtitle,
    }),
    [description, isPlaceholder, media, progress, status, subtitle, title],
  )

  const component = layout && previewComponents[layout]

  if (!component) {
    return (
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Text>Unknown layout: {layout}</Text>
      </Flex>
    )
  }

  return (
    <Card height="fill" tone="transparent">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={0}>
          <Card
            data-as={interactive ? 'button' : undefined}
            selected={interactive ? selected : undefined}
            style={{lineHeight: 0}}
          >
            {createElement(
              component as React.ComponentType<Omit<PreviewProps, 'renderDefault'>>,
              previewProps,
            )}
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
