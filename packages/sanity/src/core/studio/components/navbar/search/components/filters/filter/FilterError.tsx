import i18n from 'i18next'
import k from './../../../../../../../../i18n/keys'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Flex, ResponsivePaddingProps, Stack} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from '../../../../../../../components'

export function FilterError(props: ResponsivePaddingProps) {
  return (
    <Box {...props}>
      <Flex align="flex-start" gap={3}>
        <TextWithTone tone="critical">
          <ErrorOutlineIcon />
        </TextWithTone>
        <Stack space={4}>
          <TextWithTone size={1} tone="critical" weight="semibold">
            {i18n.t(k.AN_ERROR_OCCURRED_WHILST_DISPL)}
          </TextWithTone>
          <TextWithTone size={1} tone="critical">
            {i18n.t(k.THIS_MAY_INDICATE_INVALID_OPTI)}
          </TextWithTone>
        </Stack>
      </Flex>
    </Box>
  )
}
