import i18n from 'i18next'
import k from './../../../../../../i18n/keys'
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from '../../../../../components/TextWithTone'

export function SearchError() {
  return (
    <Flex
      align="center"
      aria-live="assertive"
      direction="column"
      flex={1}
      gap={3}
      marginY={2}
      padding={4}
    >
      <Box marginBottom={1}>
        <TextWithTone tone="critical">
          <WarningOutlineIcon />
        </TextWithTone>
      </Box>
      <TextWithTone size={2} tone="critical" weight="semibold">
        {i18n.t(k.SOMETHING_WENT_WRONG_WHILE_SEA)}
      </TextWithTone>
      <TextWithTone size={1} tone="critical">
        {i18n.t(k.PLEASE_TRY_AGAIN_OR_CHECK_YOUR)}
      </TextWithTone>
    </Flex>
  )
}
