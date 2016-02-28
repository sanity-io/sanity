
import React from 'react'
import cx from 'classnames'

import ProgressTracker from './ProgressTracker'
import FileInput from './FileInput'
import DropTarget from './DropTarget'

function toProgressObjects(files) {
  return Array.prototype.map.call(files, file => {
    return {
      id: file.name + '_' + Math.random().toString(32).substring(2),
      file: file,
      progress: 0
    }
  })
}

/**
 * This combines a FileInput, DropTarget and a ProgressTracker in a single component
 * Useful if you just want to drop in a file uploader without too much boilerplate
 */

export default React.createClass({
  displayName: 'FileUploader',
  propTypes: {
    multiple: React.PropTypes.bool,
    dropTarget: React.PropTypes.bool,
    fileInput: React.PropTypes.bool,
    progressItems: React.PropTypes.array,
    onSelectFiles: React.PropTypes.func,
    onRetry: React.PropTypes.func
  },

  handleSelectFiles(files, e) {
    if (this.props.onSelectFiles) {
      this.props.onSelectFiles(toProgressObjects(files), e)
    }
  },

  render() {
    // Show file input unless a drop target is wanted
    const hasFileInput = this.props.fileInput || !this.props.dropTarget
    const hasDropTarget = this.props.dropTarget

    const classes = cx({
      [this.props.className]: true,
      'file-uploader': true,
      multiple: this.props.multiple,
      single: !this.props.multiple
    })
    return (
      <div {...this.props} className={classes}>
        {hasFileInput && (
          <label>
            <FileInput multiple={this.props.multiple} onSelectFiles={this.handleSelectFiles}/>
          </label>
        )}

        {hasDropTarget && (
          <DropTarget multiple={this.props.multiple} onSelectFiles={this.handleSelectFiles}>
          Drop {this.props.multiple ? 'files' : 'file'} here
          </DropTarget>
        )}
          {this.props.progressItems && this.props.progressItems.map((progress, i) => {
            return (<ProgressTracker key={i} {...this.props} progress={progress} preview={this.props.preview}/>)
          })}
      </div>
    )
  }
})
