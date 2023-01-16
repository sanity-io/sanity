import {Flex, Stack, Switch, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const INCLUDE_TIME_LABEL = 'Include time'

interface DateIncludeTimeFooterProps {
  onChange: () => void
  value: boolean
}

const TimeLabelText = styled(Text)`
  cursor: default;
`

export function DateIncludeTimeFooter({onChange, value}: DateIncludeTimeFooterProps) {
  return (
    <Flex align="center" gap={2} justify="flex-end" marginTop={1}>
      <Stack>
        <TimeLabelText muted onClick={onChange} size={1} weight="medium">
          {INCLUDE_TIME_LABEL}
        </TimeLabelText>
      </Stack>
      <Switch checked={value} label={INCLUDE_TIME_LABEL} onChange={onChange} />
    </Flex>
  )
}
