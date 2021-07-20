import {IntentLink} from 'part:@sanity/base/router'
import React from 'react'
import {Box, Flex, Stack, Text, Tooltip, Button} from '@sanity/ui'
import styled from 'styled-components'
import {
  unstable_useCheckDocumentPermission as useCheckDocumentPermission,
  useCurrentUser,
} from '../../hooks'
import {InsufficientPermissionsMessage} from '../InsufficientPermissionsMessage'
import {MediaDimensions} from './types'

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
  display: 'block',
  height: '100%',
  width: '100%',
}

const Root = styled(Box)`
  height: 100%;

  a {
    color: currentColor;
    text-decoration: none;
  }

  [data-ui='Button'] {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: flex-start;
  }
`

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

  const {value: currentUser} = useCurrentUser()

  const createPermission = useCheckDocumentPermission('dummy-id', params.type, 'create')

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
    <Flex align="flex-start">
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
      {media !== false && (
        <Flex align="flex-start" paddingLeft={2}>
          <Text size={4}>
            {typeof media === 'function' && media({dimensions: mediaDimensions, layout: 'default'})}
            {typeof media === 'string' && <span>{media}</span>}
            {React.isValidElement(media) && media}
          </Text>
        </Flex>
      )}
    </Flex>
  )

  return createPermission.granted ? (
    <Root>
      <IntentLink
        intent="create"
        params={[params, templateParams]}
        title={subtitle ? `Create new ${title} (${subtitle})` : `Create new ${title}`}
        onClick={props.onClick}
        style={BLOCK_STYLE}
      >
        <Button mode="ghost" tabIndex={-1} padding={4}>
          {content}
        </Button>
      </IntentLink>
    </Root>
  ) : (
    <Tooltip
      content={
        <Box padding={2} style={{maxWidth: 300}}>
          <InsufficientPermissionsMessage
            currentUser={currentUser}
            operationLabel="create this document"
          />
        </Box>
      }
    >
      <div>{content}</div>
    </Tooltip>
  )
}
