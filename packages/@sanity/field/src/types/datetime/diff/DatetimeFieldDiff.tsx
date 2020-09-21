import React from 'react'
import {DiffComponent, DiffFromTo, StringDiff} from '../../../diff'
import {DatetimePreview} from '../preview'

export const DatetimeFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      diff={diff}
      layout="grid"
      schemaType={schemaType}
      previewComponent={DatetimePreview}
    />
  )
}
