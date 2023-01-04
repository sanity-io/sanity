import {Flex, Stack, Switch, Text} from '@sanity/ui'
import React from 'react'

const INCLUDE_TIME_LABEL = 'Include time'

interface DateIncludeTimeFooterProps {
  onChange: () => void
  value: boolean
}

export function DateIncludeTimeFooter({onChange, value}: DateIncludeTimeFooterProps) {
  return (
    <Flex align="center" gap={2} justify="flex-end" marginTop={1}>
      <Stack>
        <Text muted onClick={onChange} size={1} style={{cursor: 'default'}} weight="medium">
          {INCLUDE_TIME_LABEL}
        </Text>
      </Stack>
      <Switch checked={value} label={INCLUDE_TIME_LABEL} onChange={onChange} />
    </Flex>
  )
}
