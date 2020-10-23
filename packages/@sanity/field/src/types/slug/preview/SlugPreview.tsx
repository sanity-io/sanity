import React from 'react'
import {PreviewComponent} from '../../../preview/types'
import {Slug} from '../types'

export const SlugPreview: PreviewComponent<Slug> = (props) => {
  const {value} = props

  return <>{value.current}</>
}
