import {DocumentIcon, EditIcon} from '@sanity/icons'
import {Card, Container, Flex, Text} from '@sanity/ui'
import {useBoolean, useSelect, useString} from '@sanity/ui-workshop'
import {type ComponentType, useMemo} from 'react'

import {ContextMenuButton} from '../../contextMenuButton/ContextMenuButton'
import {PREVIEW_SIZES} from '../constants'
import {BlockImagePreview} from '../portableText/BlockImagePreview'
import {BlockPreview} from '../portableText/BlockPreview'
import {InlinePreview} from '../portableText/InlinePreview'
import {type PortableTextPreviewLayoutKey, type PreviewProps} from '../types'

const MEDIA_OPTIONS: Record<string, string> = {
  None: 'none',
  Image: 'image',
  Icon: 'icon',
}

const LAYOUT_OPTIONS: Record<string, PortableTextPreviewLayoutKey> = {
  'Block': 'block',
  'Block image': 'blockImage',
  'Inline': 'inline',
}

// const mediaValues: Record<string, ReactNode> = {
//   image: <img src="https://source.unsplash.com/70x70/?abstract" />,
//   icon: <DocumentIcon />,
// }

const previewComponents: {
  [TLayoutKey in PortableTextPreviewLayoutKey]: ComponentType<
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

  const previewProps: Omit<PreviewProps, 'renderDefault'> = useMemo(
    () => ({
      actions: withActions && <ContextMenuButton />,
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

  const Component =
    layout && (previewComponents[layout] as ComponentType<Omit<PreviewProps, 'renderDefault'>>)

  if (!Component) {
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
            <Component {...previewProps} />
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
