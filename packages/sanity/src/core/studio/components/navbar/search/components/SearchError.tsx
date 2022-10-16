import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from '../../../../../components/TextWithTone'

export function SearchError() {
  return (
    <Flex
      align="center"
      aria-live="assertive"
      direction="column"
      flex={1}
      gap={3}
      marginY={2}
      padding={4}
    >
      <Box marginBottom={1}>
        <TextWithTone tone="critical">
          <WarningOutlineIcon />
        </TextWithTone>
      </Box>
      <TextWithTone size={2} tone="critical" weight="semibold">
        Something went wrong while searching
      </TextWithTone>
      <TextWithTone size={1} tone="critical">
        Please try again or check your connection
      </TextWithTone>
    </Flex>
  )
}
