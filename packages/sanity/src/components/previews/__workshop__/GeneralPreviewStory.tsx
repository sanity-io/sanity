import {DocumentIcon, EditIcon} from '@sanity/icons'
import {Card, Container, Flex, Text} from '@sanity/ui'
import {useBoolean, useNumber, useSelect, useString, useText} from '@sanity/ui-workshop'
import React, {createElement, useMemo} from 'react'
import {GeneralPreviewLayoutKey, PreviewProps} from '../types'
import {DefaultPreview} from '../general/DefaultPreview'
import {DetailPreview} from '../general/DetailPreview'
import {MediaPreview} from '../general/MediaPreview'
import {PREVIEW_MEDIA_SIZE} from '../constants'

// Exclude deprecated layout mode
type LayoutKey = Exclude<GeneralPreviewLayoutKey, 'card'>

const MEDIA_OPTIONS: Record<string, 'none' | 'image' | 'icon' | 'text'> = {
  None: 'none',
  Image: 'image',
  Icon: 'icon',
  Text: 'text',
}

const LAYOUT_OPTIONS: Record<string, LayoutKey> = {
  Default: 'default',
  Detail: 'detail',
  Media: 'media',
}

const previewComponents: {
  [TLayoutKey in LayoutKey]: React.ComponentType<PreviewProps<TLayoutKey>>
} = {
  default: DefaultPreview,
  detail: DetailPreview,
  media: MediaPreview,
}

export default function GeneralPreviewStory() {
  const layout = useSelect('Layout', LAYOUT_OPTIONS, 'default')

  const isPlaceholder = useBoolean('Is placeholder', false)
  const interactive = useBoolean('Interactive', false)
  const mediaKey = useSelect('Media', MEDIA_OPTIONS) || 'none'
  const title = useString('Title', 'Title', 'Props')
  const subtitle = useString('Subtitle', 'Subtitle', 'Props')
  const description = useText('Description', undefined, 'Props')
  const selected = useBoolean('Selected', false, 'Props')
  const status = useBoolean('Status', false)
  const progress = useNumber('Progress (%)', 50)

  const media = useMemo(() => {
    const {width, height} = layout ? PREVIEW_MEDIA_SIZE[layout] : PREVIEW_MEDIA_SIZE.default

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
            padding={2}
            radius={2}
            selected={interactive ? selected : undefined}
            style={{lineHeight: 0}}
          >
            {createElement(component as React.ComponentType<PreviewProps>, {
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
            })}
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
