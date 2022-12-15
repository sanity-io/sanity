import i18n from 'i18next'
import k from './../../../../i18n/keys'
import {Box, Dialog, Stack, Text} from '@sanity/ui'
import React from 'react'

export function InitialValueTemplateError({errors}: {errors: Error[]}) {
  return (
    <Dialog header="Initial value template error" id="initial-value-error-dialog" width={1}>
      <Box padding={4}>
        <Stack space={4}>
          <Text>{i18n.t(k.FAILED_TO_LOAD_INITIAL_VALUE_T)}</Text>
          {errors.map((error: Error) => (
            <Text key={error.message}>
              <code>{error.message}</code>
            </Text>
          ))}
        </Stack>
      </Box>
    </Dialog>
  )
}
