import React from 'react'
import type {DiffComponent, StringDiff} from '../../../diff'
import {DiffFromTo} from '../../../diff'
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
