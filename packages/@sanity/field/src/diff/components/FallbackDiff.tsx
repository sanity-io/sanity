import React from 'react'
import Preview from 'part:@sanity/base/preview'
import {PreviewComponent} from '../../preview/types'
import {DiffComponent} from '../../types'
import {Change} from './Change'

import styles from './FallbackDiff.css'

const FallbackPreview: PreviewComponent<any> = ({color, value, schemaType}) => {
  return (
    <div className={styles.root} style={{background: color?.background, color: color?.text}}>
      <Preview type={schemaType} value={value} layout="default" />
    </div>
  )
}

export const FallbackDiff: DiffComponent<any> = ({diff, schemaType}) => {
  return (
    <Change diff={diff} schemaType={schemaType} previewComponent={FallbackPreview} layout="grid" />
  )
}
