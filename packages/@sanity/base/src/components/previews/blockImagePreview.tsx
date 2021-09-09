import React from 'react'
import {Box, Flex, Heading, Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {Root, MediaWrapper, MetadataWrapper} from './blockImagePreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 600,
  height: 600,
  fit: 'fillmax',
  dpr: getDevicePixelRatio(),
}

// @todo This is to make sure there is the correct amount of spacing below the dropdown in `BlockObjectPreview`. Remove when `BlockObjectPreview` is migrated to Sanity UI.
const STYLE_HEADING = {marginBottom: '2px'}

export const BlockImagePreview: React.FunctionComponent<PreviewProps<'block'>> = (props) => {
  const {title, subtitle, description, mediaDimensions, media, children, status} = props
  return (
    <Root>
      {title && (
        <Box as="header" paddingY={4} paddingX={[3, 4]} marginTop={1}>
          <Heading textOverflow="ellipsis" size={1} style={STYLE_HEADING}>
            {title}
          </Heading>
        </Box>
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
