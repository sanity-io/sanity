import React from 'react'
import {DiffComponent, ReferenceDiff} from '../../../diff'
import {Change} from '../../../diff/components'
import {ReferencePreview} from '../preview/ReferencePreview'

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  return (
    <Change
      previewComponent={ReferencePreview}
      layout="grid"
      path="_ref"
      diff={diff}
      schemaType={schemaType}
    />
  )
}
