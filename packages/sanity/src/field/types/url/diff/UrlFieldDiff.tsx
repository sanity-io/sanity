import {StringSchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React from 'react'
import {DiffFromTo} from '../../../diff'
import {DiffComponent, StringDiff} from '../../../types'
import {StringPreview} from '../../string/preview'

export interface UrlFieldDiffProps {
  diff: StringDiff
  schemaType: StringSchemaType
}

export const UrlFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}: UrlFieldDiffProps) => {
  return (
    <Box data-testid="url-field-diff">
      <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={StringPreview} />
    </Box>
  )
}
