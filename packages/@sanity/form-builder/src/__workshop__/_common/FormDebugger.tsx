import React from 'react'
import {Box, Card, Code, Label, Stack} from '@sanity/ui'
import type {Path} from '@sanity/types'

export interface FormDebuggerOptions {
  value: any | null
  focusPath: Path
}

export function FormDebugger(props: FormDebuggerOptions) {
  const {value, focusPath} = props
  return (
    <Card padding={4} tone="default" border>
      <Stack space={4}>
        <Label size={0}>Debug output</Label>
        <Box overflow="auto">
          <Code>{JSON.stringify({focusPath, value}, null, 2)}</Code>
        </Box>
      </Stack>
    </Card>
  )
}
