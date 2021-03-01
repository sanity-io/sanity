import {Reference} from '@sanity/types'
import React from 'react'
import Preview from 'part:@sanity/base/preview'
import {getReferencedType} from '../../../schema/helpers'
import {PreviewComponent} from '../../../preview/types'

export const ReferencePreview: PreviewComponent<Reference> = ({value, schemaType}) => (
  <Preview type={getReferencedType(schemaType)} value={value} layout="default" />
)
