import PropTypes from 'prop-types'
import React from 'react'
import ProgressBar from 'part:@sanity/components/progress/bar'
import {PreviewAny} from './utils/fallback-preview/PreviewAny'

function extractUploadState(value) {
  if (!value || typeof value !== 'object') {
    return value
  }
  const {_upload, ...rest} = value
  return {_upload, value: rest}
}

export default class Preview extends React.Component {

  static propTypes = {
    layout: PropTypes.string,
    value: PropTypes.any,
    type: PropTypes.object.isRequired
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }


  render() {
    const {type, layout} = this.props
    const {_upload, value} = extractUploadState(this.props.value)
    const PreviewComponent = this.context.formBuilder.resolvePreviewComponent(type)

    if (PreviewComponent) {
      const renderedPreview = (<PreviewComponent type={type} value={value} layout={layout} />)

      return _upload
        ? (
          <div style={{position: 'relative'}}>
            <ProgressBar showPercent percent={_upload.percent || 0} completed={_upload.percent === 100} />
            {renderedPreview}
          </div>
        )
        : renderedPreview
    }
    return (
      <div title="Unable to resolve preview component. Using fallback.">
        <PreviewAny value={value} maxDepth={2} />
      </div>
    )
  }
}
