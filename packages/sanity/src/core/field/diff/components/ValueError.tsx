import i18n from 'i18next'
import k from './../../../../i18n/keys'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Text, Box, Card, Flex} from '@sanity/ui'
import React from 'react'
import {FieldValueError} from '../../validation'

/** @internal */
export function ValueError({error}: {error: FieldValueError}) {
  return (
    <Card tone="critical" padding={3}>
      <Flex align="flex-start">
        <Box>
          <Text>
            <ErrorOutlineIcon />
          </Text>
        </Box>
        <Box flex={1} paddingLeft={3}>
          <Text size={1} as="p">
            {i18n.t(k.VALUE_ERROR)} {error.message}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}
