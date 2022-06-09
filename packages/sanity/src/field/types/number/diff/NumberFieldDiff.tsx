import React from 'react'
import {DiffFromTo} from '../../../diff'
import {DiffComponent, NumberDiff} from '../../../types'
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
