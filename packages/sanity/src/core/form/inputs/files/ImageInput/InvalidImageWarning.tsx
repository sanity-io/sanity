import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Box, Text, Stack, Button} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useTranslation} from '../../../../i18n'

type Props = {
  onClearValue?: () => void
}

const ButtonWrapper = styled(Button)`
  width: 100%;
`

export function InvalidImageWarning({onClearValue}: Props) {
  const {t} = useTranslation('sanity')
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
            {t('inputs.files.image.invalid-image-warning.title')}
          </Text>
          <Text size={1}>{t('inputs.files.image.invalid-image-warning.description')}</Text>
        </Stack>
      </Flex>
      <ButtonWrapper icon={ResetIcon} text="Reset value" onClick={onClearValue} mode="ghost" />
    </Card>
  )
}
