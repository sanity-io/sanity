import React from 'react'
import {DiffComponent, ReferenceDiff} from '../../../diff'
import {Change} from '../../../diff/components'
import {ReferencePreview} from '../preview/ReferencePreview'

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  return (
    <Change
      diff={diff}
      layout="grid"
      path="_ref"
      previewComponent={ReferencePreview}
      schemaType={schemaType}
    />
  )
}
