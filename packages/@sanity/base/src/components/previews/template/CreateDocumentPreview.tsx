import React from 'react'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import styled from 'styled-components'
import {IntentButton} from '../../IntentButton'
import {MediaDimensions} from '../types'

interface CreateDocumentPreviewProps {
  title?: React.ReactNode | React.FunctionComponent<unknown>
  subtitle?: React.ReactNode | React.FunctionComponent<{layout: 'default'}>
  description?: React.ReactNode | React.FunctionComponent<unknown>
  media?: React.ReactNode | React.FunctionComponent<unknown>
  icon?: React.ComponentType<unknown>
  isPlaceholder?: boolean
  params?: {
    intent: 'create'
    type: string
    template?: string
  }
  templateParams?: Record<string, unknown>
  onClick?: () => void
  mediaDimensions?: MediaDimensions
}

const DEFAULT_MEDIA_DIMENSION: MediaDimensions = {
  width: 80,
  height: 80,
  aspect: 1,
  fit: 'crop',
}

const BLOCK_STYLE = {
  display: 'flex',
  height: '100%',
  width: '100%',
  alignItems: 'flex-start',
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

/**
 * @deprecated
 */
export function CreateDocumentPreview(props: CreateDocumentPreviewProps) {
  const {
    title = 'Untitled',
    subtitle,
    media = props.icon,
    isPlaceholder,
    mediaDimensions = DEFAULT_MEDIA_DIMENSION,
    description,
    params,
    templateParams,
  } = props

  if (isPlaceholder || !params) {
    return (
      <Root>
        <Stack space={3} flex={1}>
          <Text as="h2">Loading…</Text>
          <Text as="p" size={1}>
            Loading…
          </Text>
        </Stack>
        {media !== false && <Flex align="flex-start" padding={2} />}
      </Root>
    )
  }

  const content = (
    <Root>
      <Flex align={description ? 'flex-start' : 'center'}>
        <Stack space={3} flex={1}>
          <Text as="h2" style={{whiteSpace: 'break-spaces'}}>
            {typeof title !== 'function' && title}
            {typeof title === 'function' && title({layout: 'default'})}
          </Text>
          {subtitle && (
            <Text size={1} as="p" textOverflow="ellipsis">
              {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
            </Text>
          )}

          {description && (
            <Text as="p" size={1} style={{whiteSpace: 'break-spaces'}}>
              {description}
            </Text>
          )}
        </Stack>
        {media && (
          <Text size={1}>
            <Flex align="flex-start" paddingLeft={2}>
              {typeof media === 'function' &&
                media({dimensions: mediaDimensions, layout: 'default'})}
              {typeof media === 'string' && <span>{media}</span>}
              {React.isValidElement(media) && media}
            </Flex>
          </Text>
        )}
      </Flex>
    </Root>
  )

  return (
    <IntentButton
      intent="create"
      params={[params, templateParams]}
      title={subtitle ? `Create new ${title} (${subtitle})` : `Create new ${title}`}
      onClick={props.onClick}
      style={BLOCK_STYLE}
      mode="ghost"
      fontSize={2}
    >
      {content}
    </IntentButton>
  )
}
