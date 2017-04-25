import PropTypes from 'prop-types'
import React from 'react'
import customResolver from 'part:@sanity/base/preview-resolver?'
import SanityDefaultPreview from './SanityDefaultPreview'

// Set this to true for debugging preview subscriptions
const DEBUG = false

function resolvePreview(type) {
  const custom = customResolver && customResolver(type)
  return custom || SanityDefaultPreview
}

export default function RenderPreviewSnapshot(props) {
  const {snapshot, type, isLive, layout} = props
  const PreviewComponent = resolvePreview(type)
  const preview = (
    <PreviewComponent
      value={snapshot}
      type={type}
      layout={layout}
      isPlaceholder={!snapshot}
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

RenderPreviewSnapshot.propTypes = {
  snapshot: PropTypes.object,
  type: PropTypes.object,
  isLive: PropTypes.bool,
  layout: PropTypes.string
}
