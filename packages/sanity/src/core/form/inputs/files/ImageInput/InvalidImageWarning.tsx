import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Box, Text, Stack} from '@sanity/ui'
import React from 'react'
import {Button} from '../../../../../ui'

type Props = {
  onClearValue?: () => void
}

export function InvalidImageWarning({onClearValue}: Props) {
  return (
    <Card tone="caution" padding={4} border radius={2}>
      <Flex gap={4} marginBottom={4}>
        <Box>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>
        <Stack space={3}>
          <Text size={1} weight="medium">
            Invalid image value
          </Text>
          <Text size={1}>
            The value of this field is not a valid image. Resetting this field will let you choose a
            new image.
          </Text>
        </Stack>
      </Flex>
      <Button
        width="fill"
        icon={ResetIcon}
        text="Reset value"
        onClick={onClearValue}
        mode="ghost"
      />
    </Card>
  )
}
