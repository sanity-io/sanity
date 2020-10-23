import React from 'react'
import {PreviewComponent} from '../../../preview/types'

export const NumberPreview: PreviewComponent<string> = (props) => {
  const {value} = props

  return <>{value}</>
}
