import React, {useCallback} from 'react'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {HeaderFlex, MediaCard, RootBox} from './blockImagePreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 600,
  height: 400,
  fit: 'fillmax',
  dpr: getDevicePixelRatio(),
}

export const BlockImagePreview: React.FunctionComponent<PreviewProps<'block'>> = (props) => {
  const {
    actions,
    title,
    subtitle,
    description,
    fallbackTitle = 'Untitled',
    mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
    media,
    children,
    status,
  } = props

  const getRatio = useCallback((dimensions: MediaDimensions) => {
    const {height, width} = dimensions

    return (height / width) * 100
  }, [])

  return (
    <RootBox overflow="hidden">
      <Stack>
        <HeaderFlex align="center" paddingLeft={3} paddingRight={1} paddingY={1}>
          <Stack space={1} flex={1}>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              {title || fallbackTitle}
            </Text>
            {subtitle && (
              <Text muted size={1} textOverflow="ellipsis">
                {subtitle}
              </Text>
            )}
          </Stack>

          <Flex align="center">
            {status && (
              <Box marginX={4}>
                {typeof status === 'function' ? status({layout: 'block'}) : status}
              </Box>
            )}
            {actions && <div>{actions}</div>}
          </Flex>
        </HeaderFlex>

        <MediaCard
          __unstable_checkered
          borderTop
          sizing="border"
          display="flex"
          tone="inherit"
          $ratio={getRatio(mediaDimensions)}
        >
          {typeof media === 'function' &&
            media({
              dimensions: mediaDimensions,
              layout: 'block',
            })}
          {typeof media === 'string' && <div>{media}</div>}
          {React.isValidElement(media) && media}
        </MediaCard>
      </Stack>

      {description && (
        <Box paddingX={2} paddingY={3}>
          <Text muted size={1}>
            {typeof description === 'function' ? description({layout: 'block'}) : description}
          </Text>
        </Box>
      )}
      {children && <div>{children}</div>}
    </RootBox>
  )
}
