import {SchemaType} from '@sanity/types'
import React from 'react'
import {PreviewProps} from '../../components/previews'
import {SortOrdering} from '../types'
import {PreviewSubscriber} from './PreviewSubscriber'
import {RenderPreviewSnapshot} from './RenderPreviewSnapshot'

export interface SanityPreviewProps extends Omit<PreviewProps, 'value'> {
  ordering?: SortOrdering
  schemaType: SchemaType
  value: NonNullable<PreviewProps['value']>
}

export function SanityPreview(props: SanityPreviewProps) {
  return <PreviewSubscriber {...props}>{RenderPreviewSnapshot}</PreviewSubscriber>
}
