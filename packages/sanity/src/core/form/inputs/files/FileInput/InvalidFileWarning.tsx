import i18n from 'i18next'
import k from './../../../../../i18n/keys'
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
            {i18n.t(k.INVALID_FILE_VALUE)}
          </Text>
          <Text size={1}>{i18n.t(k.THE_VALUE_OF_THIS_FIELD_IS_NOT)}</Text>
        </Stack>
      </Flex>
      <ButtonWrapper icon={ResetIcon} text="Reset value" onClick={onClearValue} mode="ghost" />
    </Card>
  )
}
