import React from 'react'
import FileUploader from './FileUploader'

export default React.createClass({
  displayName: 'DocumentUploader',
  render() {
    return (
      <FileUploader {...this.props} className={this.props.className + ' document-uploader'}/>
    )
  }
})
