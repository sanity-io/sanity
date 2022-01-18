import React, {useMemo} from 'react'
import {Box, Flex, rem, Stack, Text, TextSkeleton} from '@sanity/ui'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {IntentButton} from '../../IntentButton'
import {PreviewMediaDimensions} from '../types'
import {Media} from '../_common/Media'
import {PREVIEW_MEDIA_SIZE} from '../constants'

export interface CreateDocumentPreviewProps {
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
  mediaDimensions?: PreviewMediaDimensions
}

const DEFAULT_MEDIA_DIMENSION: PreviewMediaDimensions = {
  ...PREVIEW_MEDIA_SIZE.default,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
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

const HeaderFlex = styled(Flex).attrs({align: 'center'})`
  height: ${rem(PREVIEW_MEDIA_SIZE.default.height)};
`

const TitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1})`
  max-width: ${rem(160)};
  width: 80%;
`

const SubtitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1, size: 1})`
  max-width: ${rem(120)};
  width: 60%;
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

  const intentButtonParams = useMemo(() => [params, templateParams], [params, templateParams])

  if (isPlaceholder || !params) {
    return (
      <Root padding={3}>
        <HeaderFlex>
          <Stack flex={1} space={2}>
            <TitleSkeleton />
            <SubtitleSkeleton />
          </Stack>
        </HeaderFlex>
      </Root>
    )
  }

  return (
    <IntentButton
      intent="create"
      mode="ghost"
      onClick={props.onClick}
      params={intentButtonParams}
      style={BLOCK_STYLE}
      title={subtitle ? `Create new ${title} (${subtitle})` : `Create new ${title}`}
    >
      <Root>
        <HeaderFlex>
          <Stack flex={1} space={2}>
            <Text>
              {typeof title !== 'function' && title}
              {typeof title === 'function' && title({layout: 'default'})}
            </Text>

            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
              </Text>
            )}
          </Stack>

          {media && (
            <Flex align="flex-start" paddingLeft={2}>
              <Media dimensions={mediaDimensions} layout="default" media={media} />
            </Flex>
          )}
        </HeaderFlex>

        {description && (
          <Box marginTop={3}>
            <Text muted size={1} style={{whiteSpace: 'break-spaces'}}>
              {description}
            </Text>
          </Box>
        )}
      </Root>
    </IntentButton>
  )
}
