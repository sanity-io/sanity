import React from 'react'
import PreviewSubscriber from './PreviewSubscriber'
import RenderPreviewSnapshot from './RenderPreviewSnapshot'
import {Type} from '../types'

interface Props {
  type: Type
  fields: string[]
  value: any
  ordering: {}
  children: (props: any) => React.ComponentType
  layout: string
}

export default function SanityPreview(props: Props) {
  return <PreviewSubscriber {...props}>{RenderPreviewSnapshot}</PreviewSubscriber>
}
