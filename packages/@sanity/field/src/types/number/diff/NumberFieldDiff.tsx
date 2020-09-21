import React from 'react'
import {DiffComponent, DiffFromTo, NumberDiff} from '../../../diff'
import {NumberPreview} from '../preview/NumberPreview'

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      diff={diff}
      schemaType={schemaType}
      previewComponent={NumberPreview}
      layout="inline"
    />
  )
}
