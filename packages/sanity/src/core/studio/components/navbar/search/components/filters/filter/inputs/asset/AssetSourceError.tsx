import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Flex, ResponsivePaddingProps, Stack} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from '../../../../../../../../../components'

export function AssetSourceError(props: ResponsivePaddingProps) {
  return (
    <Box {...props}>
      <Flex align="flex-start" gap={3}>
        <TextWithTone tone="caution">
          <WarningOutlineIcon />
        </TextWithTone>
        <Stack space={4}>
          <TextWithTone size={1} tone="caution" weight="semibold">
            No valid asset sources found.
          </TextWithTone>
          <TextWithTone size={1} tone="caution">
            Currently, only the default asset source is supported.
          </TextWithTone>
          <TextWithTone size={1} tone="caution">
            Please ensure it's enabled in your studio configuration file.
          </TextWithTone>
        </Stack>
      </Flex>
    </Box>
  )
}
