import React from 'react'
import ProgressCircle from 'part:@sanity/components/progress/circle'

export default function UploadPreview(props) {
  const {_previewImageUrl, _percent} = props.value
  return (
    <div style={{position: 'relative'}}>
      <img src={_previewImageUrl} style={{position: 'absolute', height: '100%', width: '100%', opacity: 0.4}} />
      <ProgressCircle showPercent percent={_percent} completed={_percent === 100} />
    </div>
  )
}
