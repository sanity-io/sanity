import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Box, Text, Stack, Button} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

type Props = {
  onClearValue?: () => void
}

const ButtonWrapper = styled(Button)`
  width: 100%;
`

export function InvalidFileWarning({onClearValue}: Props) {
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
            Invalid file value
          </Text>
          <Text size={1}>
            The value of this field is not a valid file. Resetting this field will let you choose a
            new file.
          </Text>
        </Stack>
      </Flex>
      <ButtonWrapper icon={ResetIcon} text="Reset value" onClick={onClearValue} mode="ghost" />
    </Card>
  )
}
