import React from 'react'
import Preview from 'part:@sanity/base/preview'
import {DiffComponent} from '../../types'
import {Change} from '../components'

function FallbackPreview({value, schemaType}) {
  return <Preview type={schemaType} value={value} layout="default" />
}

export const FallbackDiff: DiffComponent<any> = ({diff, schemaType}) => {
  return (
    <Change
      diff={diff}
      schemaType={schemaType}
      previewComponent={FallbackPreview}
      layout="inline"
    />
  )
}
