import React from 'react'
import {DiffComponent, NumberDiff, Change} from '../../../diff'
import {NumberPreview} from '../preview/NumberPreview'

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({diff, schemaType}) => {
  return (
    <Change diff={diff} schemaType={schemaType} previewComponent={NumberPreview} layout="inline" />
  )
}
