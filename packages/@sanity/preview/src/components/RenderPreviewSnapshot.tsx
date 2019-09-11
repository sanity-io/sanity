import React from 'react'
import customResolver from 'part:@sanity/base/preview-resolver?'
import {get} from 'lodash'
import SanityDefaultPreview from './SanityDefaultPreview'
import {Type} from '../types'

// Set this to true for debugging preview subscriptions
const DEBUG = false

function resolvePreview(type) {
  const fromPreview = get(type, 'preview.component')
  if (fromPreview) {
    return fromPreview
  }
  const custom = customResolver && customResolver(type)
  return custom || SanityDefaultPreview
}

type Props = {
  snapshot: object
  type: Type
  isLive: boolean
  layout: string
}
export default function RenderPreviewSnapshot(props: Props) {
  const {snapshot, type, isLive, layout, ...rest} = props
  const PreviewComponent = resolvePreview(type)

  // TODO: Bjoerge: Check for image type with "is()"
  const renderAsBlockImage = layout === 'block' && type && type.name === 'image'

  const preview = (
    <PreviewComponent // Render media always until we have schema functionality for determining if there is media
      media={() => undefined}
      {...rest}
      value={snapshot}
      icon={type && type.icon}
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
