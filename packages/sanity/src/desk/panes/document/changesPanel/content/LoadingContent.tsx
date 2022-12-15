import i18n from 'i18next'
import k from './../../../../../i18n/keys'
import React from 'react'
import {Box, Flex, Spinner, Text} from '@sanity/ui'

export function LoadingContent() {
  return (
    <Flex align="center" justify="center">
      <Spinner muted />
      <Box marginTop={3}>
        <Text align="center">{i18n.t(k.LOADING_CHANGES)}</Text>
      </Box>
    </Flex>
  )
}
