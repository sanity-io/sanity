import PropTypes from 'prop-types'
import React from 'react'
import customResolver from 'part:@sanity/base/preview-resolver?'
import {get} from 'lodash'
import SanityDefaultPreview from './SanityDefaultPreview'

// Set this to true for debugging preview subscriptions
const DEBUG = true

function resolvePreview(type) {
  const fromPreview = get(type, 'preview.component')
  if (fromPreview) {
    return fromPreview
  }
  const custom = customResolver && customResolver(type)
  return custom || SanityDefaultPreview
}

export default function RenderPreviewSnapshot(props) {
  const {snapshot, type, isLive, layout, ...rest} = props
  const PreviewComponent = resolvePreview(type)
  const preview = (
    <PreviewComponent
      // Render media always until we have schema functionality for determing if there is media
      media={() => undefined}
      {...rest}
      value={snapshot}
      type={type}
      layout={layout}
      isPlaceholder={!snapshot}
    />
  )
  const isCached = snapshot && snapshot.__fromCache
  if (DEBUG) {
    return (
      <div>
        <span
          tabIndex={0}
          title={isLive ? 'Subscribed to changes' : 'Not subscribed to changes'}
          style={{position: 'absolute', right: 24, top: 2, zIndex: 2000}}
        >
          {isLive ? '⚡️' : '💤'}
        </span>
        <span
          tabIndex={0}
          title={isCached ? 'Cache hit' : 'Cache miss'}
          style={{position: 'absolute', right: 48, top: 2, zIndex: 2000}}
        >
          {isCached ? '☀️️️' : '☁'}
        </span>
        {preview}
      </div>
    )
  }

  return preview
}

RenderPreviewSnapshot.propTypes = {
  snapshot: PropTypes.object,
  type: PropTypes.object,
  isLive: PropTypes.bool,
  layout: PropTypes.string
}
