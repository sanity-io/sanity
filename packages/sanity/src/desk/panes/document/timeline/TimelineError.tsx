import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Stack} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from 'sanity'

export function TimelineError() {
  return (
    <Flex align="flex-start" gap={3} padding={4}>
      <TextWithTone tone="critical">
        <ErrorOutlineIcon />
      </TextWithTone>
      <Stack space={4}>
        <TextWithTone size={1} tone="critical" weight="medium">
          An error occurred whilst retrieving document changes.
        </TextWithTone>
        <TextWithTone size={1} tone="critical">
          Document history transactions have not been affected.
        </TextWithTone>
      </Stack>
    </Flex>
  )
}
