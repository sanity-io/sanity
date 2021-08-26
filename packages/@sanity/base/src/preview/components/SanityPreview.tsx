import React from 'react'
import {SortOrdering, Type} from '../types'
import PreviewSubscriber from './PreviewSubscriber'
import RenderPreviewSnapshot from './RenderPreviewSnapshot'

interface Props {
  type: Type
  fields: string[]
  value: any
  ordering?: SortOrdering
  children: (props: any) => React.ComponentType
  layout?: 'inline' | 'block' | 'default' | 'card' | 'media' | 'detail'
}

export default function SanityPreview(props: Props) {
  return <PreviewSubscriber {...props}>{RenderPreviewSnapshot}</PreviewSubscriber>
}
