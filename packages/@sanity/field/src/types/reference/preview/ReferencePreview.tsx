import {Reference} from '@sanity/types'
import React from 'react'
import Preview from 'part:@sanity/base/preview'
import {getReferencedType} from '../../../schema/helpers'
import {PreviewComponent} from '../../../preview/types'

import styles from './ReferencePreview.css'

export const ReferencePreview: PreviewComponent<Reference> = ({value, schemaType}) => (
  <div className={styles.root}>
    <Preview type={getReferencedType(schemaType)} value={value} layout="default" />
  </div>
)
