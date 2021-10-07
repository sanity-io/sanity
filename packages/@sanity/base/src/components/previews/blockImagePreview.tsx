import React from 'react'
import {Box, Flex, Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {Root, MediaWrapper, MetadataWrapper} from './blockImagePreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 600,
  height: 600,
  fit: 'fillmax',
  dpr: getDevicePixelRatio(),
}

export const BlockImagePreview: React.FunctionComponent<PreviewProps<'block'>> = (props) => {
  const {actions, title, subtitle, description, mediaDimensions, media, children, status} = props
  return (
    <Root>
      {title && (
        <Flex>
          <Box flex={1} padding={4}>
            <Text textOverflow="ellipsis" size={1}>
              {title}
            </Text>
          </Box>

          {actions && <Box padding={2}>{actions}</Box>}
        </Flex>
      )}

      <Flex justify="center" direction="column">
        {media && (
          <MediaWrapper>
            {typeof media === 'function' &&
              media({
                dimensions: mediaDimensions || DEFAULT_MEDIA_DIMENSIONS,
                layout: 'block',
              })}
            {typeof media === 'string' && <Box>{media}</Box>}
            {React.isValidElement(media) && media}
          </MediaWrapper>
        )}

        {subtitle || description || status || (
          <MetadataWrapper paddingX={2} paddingY={2}>
            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {subtitle}
              </Text>
            )}
            {description && (
              <Box marginTop={2}>
                <Text muted size={1} textOverflow="ellipsis">
                  {typeof description === 'function' ? description({layout: 'block'}) : description}
                </Text>
              </Box>
            )}
            {status && (
              <Box marginTop={2}>
                {typeof status === 'function' ? status({layout: 'block'}) : status}
              </Box>
            )}
          </MetadataWrapper>
        )}
      </Flex>

      {children && <Box>{children}</Box>}
    </Root>
  )
}
