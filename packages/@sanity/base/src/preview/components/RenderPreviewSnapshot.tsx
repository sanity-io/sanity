import React from 'react'
import {
  isReferenceSchemaType,
  PreviewValue,
  SanityDocument,
  SchemaType,
  SortOrdering,
} from '@sanity/types'
import {get} from 'lodash'
import {customPreviewResolver} from '../../TODO'
import {isRecord} from '../../util/isRecord'
import {SanityDefaultPreview} from './SanityDefaultPreview'

interface RenderPreviewSnapshotProps {
  error?: Error
  isLive: boolean
  isLoading: boolean
  layout?: 'default' | 'detail' | 'card' | 'media' | 'inline' | 'block'
  ordering?: SortOrdering
  snapshot: Partial<SanityDocument> | PreviewValue | null
  type: SchemaType
}

function resolvePreview(type: SchemaType) {
  const fromPreview = get(type, 'preview.component')

  if (fromPreview) {
    return fromPreview
  }

  const custom = customPreviewResolver && customPreviewResolver(type)

  return custom || SanityDefaultPreview
}

export function RenderPreviewSnapshot(props: RenderPreviewSnapshotProps) {
  const {snapshot, type, isLoading, layout, ...rest} = props
  const PreviewComponent = resolvePreview(type)

  // TODO: Bjoerge: Check for image type with "is()"
  const renderAsBlockImage = layout === 'block' && type && type.name === 'image'
  const typeName = isRecord(snapshot?._internalMeta) ? snapshot?._internalMeta._type : undefined
  const icon =
    (isReferenceSchemaType(type) && type.to.find((t) => t.name === typeName)?.icon) || type.icon

  const preview = (
    <PreviewComponent
      media={icon}
      {...rest}
      _renderAsBlockImage={renderAsBlockImage}
      icon={icon}
      isLoading={isLoading}
      isPlaceholder={!snapshot}
      // isPlaceholder={isLoading}
      layout={layout}
      value={snapshot}
    />
  )

  return preview
}
