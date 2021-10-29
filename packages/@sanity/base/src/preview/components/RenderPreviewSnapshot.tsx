import React from 'react'
import {isReferenceSchemaType, SchemaType} from '@sanity/types'
import {get} from 'lodash'
import {previewResolver as customResolver} from '../../legacyParts'
import SanityDefaultPreview from './SanityDefaultPreview'

function resolvePreview(type: SchemaType) {
  const fromPreview = get(type, 'preview.component')
  if (fromPreview) {
    return fromPreview
  }
  const custom = customResolver && customResolver(type)
  return custom || SanityDefaultPreview
}

type Props = {
  snapshot: any
  type: SchemaType
  isLive: boolean
  isLoading: boolean
  layout: string
}

export default function RenderPreviewSnapshot(props: Props) {
  const {snapshot, type, isLive, isLoading, layout, ...rest} = props
  const PreviewComponent = resolvePreview(type)

  // TODO: Bjoerge: Check for image type with "is()"
  const renderAsBlockImage = layout === 'block' && type && type.name === 'image'
  const typeName = snapshot?._type
  const icon =
    (isReferenceSchemaType(type) && type.to.find((t) => t.name === typeName)?.icon) || type.icon

  const preview = (
    <PreviewComponent
      media={icon}
      {...rest}
      value={snapshot}
      icon={icon}
      layout={layout}
      isPlaceholder={isLoading}
      _renderAsBlockImage={renderAsBlockImage}
    />
  )

  return preview
}
