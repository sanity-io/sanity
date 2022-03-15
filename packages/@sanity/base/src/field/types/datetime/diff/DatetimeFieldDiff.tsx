import React from 'react'
import {DiffFromTo} from '../../../diff'
import {DiffComponent, StringDiff} from '../../../types'
import {DatetimePreview} from '../preview'

export const DatetimeFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      align="center"
      diff={diff}
      schemaType={schemaType}
      previewComponent={DatetimePreview}
    />
  )
}
