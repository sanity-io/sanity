import {SchemaType} from '@sanity/types'
import React from 'react'
import type {SortOrdering} from '../types'
import PreviewSubscriber from './PreviewSubscriber'
import RenderPreviewSnapshot from './RenderPreviewSnapshot'

interface Props {
  type: SchemaType
  value: any
  ordering?: SortOrdering
  children?: (props: any) => React.ReactElement
  layout: 'default' | 'card' | 'media' | 'detail' | 'inline' | 'block'
}

export default function SanityPreview(props: Props) {
  return <PreviewSubscriber {...props}>{RenderPreviewSnapshot}</PreviewSubscriber>
}
