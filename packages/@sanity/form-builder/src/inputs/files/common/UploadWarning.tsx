import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Box, Text, Stack, Button} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

type Props = {
  onClearStale?: () => void
}

const ButtonWrapper = styled(Button)`
  width: 100%;
`

export function UploadWarning({onClearStale}: Props) {
  return (
    <Card tone="caution" padding={4} border radius={2}>
      <Flex gap={4} marginBottom={4}>
        <Box>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>
        <Stack space={3}>
          <Text size={1} weight="semibold">
            Incomplete upload
          </Text>
          <Text size={1}>
            An upload has made no progress in the last 6m and likely got interrupted. You can safely
            clear the incomplete upload and try uploading again.
          </Text>
        </Stack>
      </Flex>
      <ButtonWrapper icon={ResetIcon} text="Clear upload" onClick={onClearStale} mode="ghost" />
    </Card>
  )
}
