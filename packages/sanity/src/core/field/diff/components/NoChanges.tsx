import i18n from 'i18next'
import k from './../../../../i18n/keys'
import {Stack, Text} from '@sanity/ui'
import React from 'react'

/** @internal */
export function NoChanges() {
  return (
    <Stack space={3}>
      <Text size={1} weight="semibold" as="h3">
        {i18n.t(k.THERE_ARE_NO_CHANGES)}
      </Text>
      <Text as="p" size={1} muted>
        {i18n.t(k.EDIT_THE_DOCUMENT_OR_SELECT_AN)}
      </Text>
    </Stack>
  )
}
