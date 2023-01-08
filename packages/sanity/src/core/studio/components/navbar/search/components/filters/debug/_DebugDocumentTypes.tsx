import {Card, Code, Stack} from '@sanity/ui'
import React from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {SearchFilter} from '../../../types'
import {getFieldFromFilter} from '../../../utils/filterUtils'

interface DebugDocumentTypesProps {
  filter: SearchFilter
}

export function DebugDocumentTypes({filter}: DebugDocumentTypesProps) {
  const {
    state: {
      definitions: {fields},
    },
  } = useSearchState()
  const fieldDefinition = getFieldFromFilter(fields, filter)

  return (
    <Card borderTop padding={3} tone="transparent">
      <Stack space={2}>
        <Code size={0} weight="semibold">
          Document types
        </Code>
        <Code muted size={0} style={{whiteSpace: 'normal'}}>
          {fieldDefinition?.documentTypes && fieldDefinition.documentTypes.length > 0
            ? fieldDefinition.documentTypes?.join(', ')
            : '(all)'}
        </Code>
      </Stack>
    </Card>
  )
}
