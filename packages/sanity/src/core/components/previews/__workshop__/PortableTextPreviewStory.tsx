import {DocumentIcon, EditIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {Card, Container, Flex, Text} from '@sanity/ui'
import {useBoolean, useSelect, useString} from '@sanity/ui-workshop'
import React, {ComponentType, createElement, useMemo} from 'react'
import {PortableTextPreviewLayoutKey, PreviewProps} from '../types'
import {InlinePreview} from '../portableText/InlinePreview'
import {Button} from '../../../../ui'
import {BlockPreview} from '../portableText/BlockPreview'
import {BlockImagePreview} from '../portableText/BlockImagePreview'
import {PREVIEW_MEDIA_SIZE} from '../constants'

const MEDIA_OPTIONS: Record<string, string> = {
  None: 'none',
  Image: 'image',
  Icon: 'icon',
}

const LAYOUT_OPTIONS: Record<string, PortableTextPreviewLayoutKey> = {
  Block: 'block',
  'Block image': 'blockImage',
  Inline: 'inline',
}

// const mediaValues: Record<string, React.ReactNode> = {
//   image: <img src="https://source.unsplash.com/70x70/?abstract" />,
//   icon: <DocumentIcon />,
// }

const previewComponents: {
  [TLayoutKey in PortableTextPreviewLayoutKey]: React.ComponentType<
    Omit<PreviewProps<TLayoutKey>, 'renderDefault'>
  >
} = {
  block: BlockPreview,
  blockImage: BlockImagePreview,
  inline: InlinePreview,
}

const padding: Record<PortableTextPreviewLayoutKey, number> = {
  block: 1,
  blockImage: 0,
  inline: 1,
}

export default function PortableTextPreviewStory() {
  const layout = useSelect('Layout', LAYOUT_OPTIONS, 'block')

  const withActions = useBoolean('With actions', false)
  const isPlaceholder = useBoolean('Is placeholder', false)
  const mediaKey = useSelect('Media', MEDIA_OPTIONS) || 'none'
  const title = useString('Title', 'Title', 'Props')
  const subtitle = useString('Subtitle', 'Subtitle', 'Props')
  const status = useBoolean('Status', false)

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

  const previewProps: Omit<PreviewProps, 'renderDefault'> = useMemo(
    () => ({
      actions: withActions && <Button icon={EllipsisVerticalIcon} mode="bleed" size="small" />,
      isPlaceholder,
      media,
      status: status && (
        <Text muted size={1}>
          <EditIcon />
        </Text>
      ),
      title,
      subtitle,
    }),
    [isPlaceholder, media, status, subtitle, title, withActions],
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
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={1}>
          <Card border padding={padding[layout]} radius={1} style={{lineHeight: 0}}>
            {createElement(
              component as ComponentType<Omit<PreviewProps, 'renderDefault'>>,
              previewProps,
            )}
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
