import React from 'react'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {RootStack, MediaWrapper, HeaderFlex} from './blockImagePreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 600,
  height: 600,
  fit: 'fillmax',
  dpr: getDevicePixelRatio(),
}

export const BlockImagePreview: React.FunctionComponent<PreviewProps<'block'>> = (props) => {
  const {actions, title, subtitle, description, mediaDimensions, media, children, status} = props

  return (
    <RootStack space={1}>
      <HeaderFlex align="center" paddingLeft={2}>
        <Flex flex={1} align="center" marginRight={4}>
          <Stack space={2} flex={1}>
            {title && (
              <Text textOverflow="ellipsis" size={1}>
                {title}
              </Text>
            )}

            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {subtitle}
              </Text>
            )}
          </Stack>

          {status && (
            <Box marginLeft={4}>
              {typeof status === 'function' ? status({layout: 'block'}) : status}
            </Box>
          )}
        </Flex>

        {actions && <div>{actions}</div>}
      </HeaderFlex>

      {media && (
        <MediaWrapper>
          {typeof media === 'function' &&
            media({
              dimensions: mediaDimensions || DEFAULT_MEDIA_DIMENSIONS,
              layout: 'block',
            })}
          {typeof media === 'string' && <div>{media}</div>}
          {React.isValidElement(media) && media}
        </MediaWrapper>
      )}

      {description && (
        <Box padding={2}>
          <Text muted size={1} textOverflow="ellipsis">
            {typeof description === 'function' ? description({layout: 'block'}) : description}
          </Text>
        </Box>
      )}

      {children && <div>{children}</div>}
    </RootStack>
  )
}
