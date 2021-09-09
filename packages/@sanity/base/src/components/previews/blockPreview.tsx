import React, {createElement} from 'react'
import {Box, Text} from '@sanity/ui'
import {MediaDimensions} from './types'
import {MediaWrapper, Root, Header, ContentWrapper} from './blockPreview.styled'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

type BlockPreviewFieldProp = React.ReactNode | (({layout}: {layout?: string}) => void)

type BlockPreviewMediaComponent = React.FunctionComponent<{
  dimensions: MediaDimensions
  layout: 'default'
}>

type BlockPreviewStatusComponent = React.FunctionComponent<{
  layout: 'default'
}>

interface BlockPreviewProps {
  title?: BlockPreviewFieldProp
  subtitle?: BlockPreviewFieldProp
  description?: BlockPreviewFieldProp
  mediaDimensions?: MediaDimensions
  media?: React.ReactNode | BlockPreviewMediaComponent
  status?: React.ReactNode | BlockPreviewStatusComponent
  children?: React.ReactNode
  extendedPreview?: BlockPreviewFieldProp
}

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 40,
  height: 40,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

export const BlockPreview: React.FunctionComponent<BlockPreviewProps> = (props) => {
  const {
    title,
    subtitle,
    description,
    mediaDimensions,
    media,
    status,
    children,
    extendedPreview,
  } = props
  return (
    <Root>
      <Header padding={2} align="center">
        {media && (
          <MediaWrapper marginRight={3}>
            {typeof media === 'function' &&
              media({
                dimensions: mediaDimensions || DEFAULT_MEDIA_DIMENSIONS,
                layout: 'default',
              })}
            {typeof media === 'string' && <Box>{media}</Box>}
            {React.isValidElement(media) && media}
          </MediaWrapper>
        )}

        <ContentWrapper flex={1} paddingY={1}>
          <Text textOverflow="ellipsis" style={{color: 'inherit'}}>
            {title && (
              <>
                {typeof title !== 'function' && title}
                {typeof title === 'function' && title({layout: 'default'})}
              </>
            )}
            {!title && <>Untitled</>}
          </Text>

          {subtitle && (
            <Box marginTop={1}>
              <Text muted size={1} textOverflow="ellipsis">
                {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
              </Text>
            </Box>
          )}
          {description && (
            <Box marginTop={3}>
              <Text muted size={1} textOverflow="ellipsis">
                {(typeof description === 'function' && description({layout: 'default'})) ||
                  description}
              </Text>
            </Box>
          )}
        </ContentWrapper>

        {status && (
          <Box padding={3}>
            {(typeof status === 'function' &&
              createElement(status as BlockPreviewStatusComponent, {
                layout: 'default',
              })) ||
              status}
          </Box>
        )}
      </Header>

      {children && <Box>{children}</Box>}

      {extendedPreview && <Box>{extendedPreview}</Box>}
    </Root>
  )
}
