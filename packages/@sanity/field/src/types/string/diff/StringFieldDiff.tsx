import React from 'react'
import {DiffComponent, StringDiff, AnnotatedStringDiff, Change} from '../../../diff'
import {StringPreview} from '../preview/StringPreview'

export const StringFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  const {options} = schemaType

  if (options?.list) {
    // When the string is considered to be an "enum", don't show individual
    // string segment changes, rather treat is as a "from -> to" diff
    return <Change diff={diff} previewComponent={StringPreview} schemaType={schemaType} />
  }

  return <AnnotatedStringDiff diff={diff} />
}
