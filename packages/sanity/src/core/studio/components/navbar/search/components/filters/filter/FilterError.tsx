import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Flex, ResponsivePaddingProps, Stack} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from '../../../../../../../components'

export function FilterError(props: ResponsivePaddingProps) {
  return (
    <Box {...props}>
      <Flex align="flex-start" gap={3}>
        <TextWithTone tone="critical">
          <ErrorOutlineIcon />
        </TextWithTone>
        <Stack space={4}>
          <TextWithTone size={1} tone="critical" weight="semibold">
            An error occurred whilst displaying this filter.
          </TextWithTone>
          <TextWithTone size={1} tone="critical">
            This may indicate invalid options defined in your schema.
          </TextWithTone>
        </Stack>
      </Flex>
    </Box>
  )
}
