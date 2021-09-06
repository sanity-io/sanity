import React from 'react'
import {Box, Flex, Heading, Text} from '@sanity/ui'
import {MediaDimensions} from './types'
import {Root, MediaWrapper, MetadataWrapper} from './blockImagePreview.styled'

type BlockImagePreviewStatusComponent = React.FunctionComponent<{
  layout: 'default'
}>

interface BlockImagePreviewProps {
  title?: React.ReactNode | React.FC<Record<string, unknown>>
  subtitle?: React.ReactNode | React.FC<Record<string, unknown>>
  description?: React.ReactNode | React.FC<Record<string, unknown>>
  mediaDimensions?: MediaDimensions
  media?:
    | React.ReactNode
    | React.FunctionComponent<{dimensions: MediaDimensions; layout: 'blockImage'}>
  children?: React.ReactNode
  status?: React.ReactNode | BlockImagePreviewStatusComponent
}

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {width: 600, height: 600, fit: 'fillmax'}

// @todo This is to make sure there is the correct amount of spacing below the dropdown in `BlockObjectPreview`. Remove when `BlockObjectPreview` is migrated to Sanity UI.
const STYLE_HEADING = {marginBottom: '2px'}

// @todo Does https://github.com/sanity-io/sanity/pull/2728 apply here in `media`?
export const BlockImagePreview: React.FunctionComponent<BlockImagePreviewProps> = (props) => {
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
                layout: 'blockImage',
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
                  {description}
                </Text>
              </Box>
            )}
            {status && (
              <Box marginTop={2}>
                {(typeof status === 'function' &&
                  status({
                    layout: 'default',
                  })) ||
                  status}
              </Box>
            )}
          </MetadataWrapper>
        )}
      </Flex>

      {children && <Box>{children}</Box>}
    </Root>
  )
}
