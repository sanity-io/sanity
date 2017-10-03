// @flow
import React from 'react'
import ProgressBar from 'part:@sanity/components/progress/bar'
import Preview from '../../Preview'

export default function UploadPreview(props: any) {
  const {_import, ...restValue} = props.value
  const preview = <Preview {...props} value={restValue} />
  return _import
    ? (
      <div style={{position: 'relative'}}>
        <ProgressBar showPercent percent={_import.percent || 0} completed={_import.percent === 100} />
        {preview}
      </div>
    )
    : preview
}
