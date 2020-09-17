import React from 'react'
import Preview from 'part:@sanity/base/preview'
import {getReferencedType} from '../../../schema/helpers'
import {PreviewComponent} from '../../../preview/types'
import {Reference} from '../../../diff'

import styles from './ReferencePreview.css'

export const ReferencePreview: PreviewComponent<Reference> = ({color, value, schemaType}) => (
  <div className={styles.root} style={{background: color?.background, color: color?.text}}>
    <Preview type={getReferencedType(schemaType)} value={value} layout="default" />
  </div>
)
