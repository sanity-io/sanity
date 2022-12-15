import i18n from 'i18next'
import k from './../../../../../../i18n/keys'
import {Container, Stack, Text} from '@sanity/ui'
import React from 'react'

export function NoResults() {
  return (
    <Container width={0}>
      <Stack aria-live="assertive" space={4} paddingX={4} paddingY={5}>
        <Text align="center" muted weight="semibold">
          {i18n.t(k.NO_RESULTS_FOUND)}
        </Text>
        <Text align="center" muted size={1}>
          {i18n.t(k.TRY_ANOTHER_KEYWORD_OR_ADJUST)}
        </Text>
      </Stack>
    </Container>
  )
}
