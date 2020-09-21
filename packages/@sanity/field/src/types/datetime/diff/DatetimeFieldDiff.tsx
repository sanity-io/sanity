import React from 'react'
import {DiffComponent, StringDiff, Change} from '../../../diff'
import {DatetimePreview} from '../preview'

export const DatetimeFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return <Change diff={diff} schemaType={schemaType} previewComponent={DatetimePreview} />
}
