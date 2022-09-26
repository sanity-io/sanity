import {DocumentIcon} from '@sanity/icons'
import {Card, Container, Flex, Text} from '@sanity/ui'
import {useBoolean, useSelect, useString, useText} from '@sanity/ui-workshop'
import React, {createElement} from 'react'
import {TemplatePreview, TemplatePreviewProps} from '../template/TemplatePreview'

type LayoutKey = 'createDocument'

const MEDIA_OPTIONS: Record<string, string> = {
  None: 'none',
  Image: 'image',
  Icon: 'icon',
}

const LAYOUT_OPTIONS: Record<string, LayoutKey> = {
  'Create document': 'createDocument',
}

const mediaValues: Record<string, React.ReactNode> = {
  image: <img src="https://source.unsplash.com/70x70/?abstract" />,
  icon: <DocumentIcon />,
}

const previewComponents: Record<LayoutKey, React.ComponentType<TemplatePreviewProps>> = {
  createDocument: TemplatePreview,
}

export default function TemplatePreviewStory() {
  const layout = useSelect('Layout', LAYOUT_OPTIONS, 'createDocument')

  const isPlaceholder = useBoolean('Is placeholder', false)
  const mediaKey = useSelect('Media', MEDIA_OPTIONS) || 'none'
  const title = useString('Title', 'Title', 'Props')
  const subtitle = useString('Subtitle', 'Subtitle', 'Props')
  const description = useText('Description', undefined, 'Props')

  const media = mediaValues[mediaKey] || false
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
          <Card padding={3} radius={2}>
            {createElement(component, {
              description,
              isPlaceholder,
              media,
              title,
              subtitle,
            })}
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
