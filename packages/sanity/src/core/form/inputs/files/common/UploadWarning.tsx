import i18n from 'i18next'
import k from './../../../../../i18n/keys'
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
            {i18n.t(k.INCOMPLETE_UPLOAD)}
          </Text>
          <Text size={1}>{i18n.t(k.AN_UPLOAD_HAS_MADE_NO_PROGRESS)}</Text>
        </Stack>
      </Flex>
      <ButtonWrapper icon={ResetIcon} text="Clear upload" onClick={onClearStale} mode="ghost" />
    </Card>
  )
}
