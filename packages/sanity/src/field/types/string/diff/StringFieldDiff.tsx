import {StringSchemaType} from '@sanity/types'
import React from 'react'
import styled from 'styled-components'
import {DiffFromTo, DiffString} from '../../../diff'
import {DiffComponent, StringDiff} from '../../../types'
import {StringPreview} from '../preview/StringPreview'

const StringWrapper = styled.div`
  white-space: pre-wrap;
  word-wrap: break-word;
`

export interface StringFieldDiffProps {
  diff: StringDiff
  schemaType: StringSchemaType
}

export const StringFieldDiff: DiffComponent<StringDiff> = ({
  diff,
  schemaType,
}: StringFieldDiffProps) => {
  const {options} = schemaType

  if (options?.list) {
    // When the string is considered to be an "enum", don't show individual
    // string segment changes, rather treat is as a "from -> to" diff
    return <DiffFromTo diff={diff} previewComponent={StringPreview} schemaType={schemaType} />
  }

  return (
    <StringWrapper data-testid="string-field-diff">
      <DiffString diff={diff} />
    </StringWrapper>
  )
}
