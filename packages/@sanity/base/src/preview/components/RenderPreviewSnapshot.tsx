// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import customResolver from 'part:@sanity/base/preview-resolver?'
import {get} from 'lodash'
import {Type} from '../types'
import SanityDefaultPreview from './SanityDefaultPreview'
import {isReferenceSchemaType} from '@sanity/types'

// Set this to true for debugging preview subscriptions
const DEBUG = false

function resolvePreview(type: Type) {
  const fromPreview = get(type, 'preview.component')
  if (fromPreview) {
    return fromPreview
  }
  const custom = customResolver && customResolver(type)
  return custom || SanityDefaultPreview
}

type Props = {
  snapshot: any
  type: Type
  isLive: boolean
  layout: string
}

export default function RenderPreviewSnapshot(props: Props) {
  const {snapshot, type, isLive, layout, ...rest} = props
  const PreviewComponent = resolvePreview(type)

  // TODO: Bjoerge: Check for image type with "is()"
  const renderAsBlockImage = layout === 'block' && type && type.name === 'image'
  const typeName = snapshot?._type
  const icon =
    (isReferenceSchemaType(type) && type.to.find((t) => t.name === typeName)?.icon) || type.icon
  const preview = (
    <PreviewComponent // Render media always until we have schema functionality for determining if there is media
      media={() => undefined}
      {...rest}
      value={snapshot}
      icon={icon}
      layout={layout}
      isPlaceholder={!snapshot}
      _renderAsBlockImage={renderAsBlockImage}
    />
  )

  if (DEBUG) {
    return (
      <div>
        <span style={{position: 'absolute', right: 24, top: 2}}>{isLive ? '⚡️' : '💤'}</span>
        {preview}
      </div>
    )
  }

  return preview
}
