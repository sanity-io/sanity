import {DocumentIcon} from '@sanity/icons'
import {Card, Container, Flex, Text} from '@sanity/ui'
import {useAction, useBoolean, useSelect, useString, useText} from '@sanity/ui-workshop'
import {omit} from 'lodash'
import React, {createElement, useMemo} from 'react'
import {CreateDocumentPreview, CreateDocumentPreviewProps} from '../template/CreateDocumentPreview'
import {route, RouterProvider} from '../../../router'

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

const previewComponents: Record<LayoutKey, React.ComponentType<CreateDocumentPreviewProps>> = {
  createDocument: CreateDocumentPreview,
}

function decodeParams(str: string) {
  return {...JSON.parse(str), intent: 'create'}
}

function encodeParams(obj: Record<string, unknown>) {
  return JSON.stringify(omit(obj, 'intent'))
}

export default function TemplatePreviewStory() {
  const layout = useSelect('Layout', LAYOUT_OPTIONS, 'createDocument')

  const isPlaceholder = useBoolean('Is placeholder', false)
  const mediaKey = useSelect('Media', MEDIA_OPTIONS) || 'none'
  const title = useString('Title', 'Title', 'Props')
  const subtitle = useString('Subtitle', 'Subtitle', 'Props')
  const description = useText('Description', undefined, 'Props')

  const media = mediaValues[mediaKey] || false
  const params = useMemo(() => ({intent: 'create' as const, type: 'book'}), [])
  const component = previewComponents[layout]

  const router = useMemo(
    () =>
      route('/:intent', [
        route(':params', {transform: {params: {toState: decodeParams, toPath: encodeParams}}}, [
          route(':payload', {transform: {payload: {toState: decodeParams, toPath: encodeParams}}}),
        ]),
      ]),
    []
  )

  const routerState = useMemo(() => ({}), [])
  const handleNavigate = useAction('onNavigate')

  if (!component) {
    return (
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Text>Unknown layout: {layout}</Text>
      </Flex>
    )
  }

  return (
    <RouterProvider onNavigate={handleNavigate} router={router} state={routerState}>
      <Card height="fill" tone="transparent">
        <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
          <Container width={0}>
            <Card padding={2} radius={2}>
              {createElement(component, {
                description,
                isPlaceholder,
                media,
                params,
                title,
                subtitle,
              })}
            </Card>
          </Container>
        </Flex>
      </Card>
    </RouterProvider>
  )
}
