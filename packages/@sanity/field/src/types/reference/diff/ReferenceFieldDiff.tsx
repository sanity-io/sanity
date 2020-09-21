import React from 'react'
import {DiffComponent, DiffFromTo, ReferenceDiff} from '../../../diff'
import {ReferencePreview} from '../preview/ReferencePreview'

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      diff={diff}
      layout="grid"
      path="_ref"
      previewComponent={ReferencePreview}
      schemaType={schemaType}
    />
  )
}
