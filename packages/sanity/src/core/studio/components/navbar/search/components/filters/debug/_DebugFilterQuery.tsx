import i18n from 'i18next'
import k from './../../../../../../../../i18n/keys'
import {Card, Code, Stack} from '@sanity/ui'
import React from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'

export function DebugFilterQuery() {
  const {
    state: {
      terms: {filter},
    },
  } = useSearchState()

  if (!filter) {
    return null
  }

  return (
    <Card padding={4} tone="transparent">
      <Stack space={3}>
        <Code size={1} weight="semibold">
          {i18n.t(k.FILTER)}
        </Code>
        {filter && <Code size={1}>{filter}</Code>}
      </Stack>
    </Card>
  )
}
