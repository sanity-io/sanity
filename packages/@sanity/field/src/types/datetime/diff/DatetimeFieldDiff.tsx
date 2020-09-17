import React from 'react'
import {DiffComponent, StringDiff, Change} from '../../../diff'
import {DatetimePreview} from '../preview'

export const DatetimeFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return (
    <Change diff={diff} layout="grid" schemaType={schemaType} previewComponent={DatetimePreview} />
  )
}
