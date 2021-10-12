import React from 'react'
import {Box, Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {MediaWrapper, RootStack, Header, ContentWrapper} from './blockPreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 40,
  height: 40,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

export const BlockPreview: React.FunctionComponent<PreviewProps<'block'>> = (props) => {
  const {
    actions,
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
    <RootStack space={1} data-testid="block-preview">
      <Header align="center">
        {media && (
          <MediaWrapper marginRight={1}>
            {typeof media === 'function' &&
              media({
                dimensions: mediaDimensions || DEFAULT_MEDIA_DIMENSIONS,
                layout: 'block',
              })}
            {typeof media === 'string' && <Box>{media}</Box>}
            {React.isValidElement(media) && media}
          </MediaWrapper>
        )}

        <ContentWrapper flex={1} paddingY={1}>
          <Text size={1} textOverflow="ellipsis">
            {title && typeof title === 'function' ? title({layout: 'block'}) : title}
            {!title && <>Untitled</>}
          </Text>

          {subtitle && (
            <Box marginTop={1}>
              <Text muted size={1} textOverflow="ellipsis">
                {typeof subtitle === 'function' ? subtitle({layout: 'block'}) : subtitle}
              </Text>
            </Box>
          )}
          {description && (
            <Box marginTop={3}>
              <Text muted size={1} textOverflow="ellipsis">
                {typeof description === 'function' ? description({layout: 'block'}) : description}
              </Text>
            </Box>
          )}
        </ContentWrapper>

        {status && (
          <Box padding={3}>{typeof status === 'function' ? status({layout: 'block'}) : status}</Box>
        )}

        {actions && <Box>{actions}</Box>}
      </Header>

      {children && <Box>{children}</Box>}

      {extendedPreview && <Box>{extendedPreview}</Box>}
    </RootStack>
  )
}
