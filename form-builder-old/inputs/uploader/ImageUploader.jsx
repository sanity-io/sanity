/* global window */
import React from 'react'
import FileUploader from './FileUploader'
import readExif from './readExif'
import rotateImage from './rotateImage'

export default React.createClass({
  displayName: 'ImageUploader',

  getDefaultProps() {
    return {exif: true}
  },
  handleSelectFiles(progressItems) {
    if (!this.props.exif) {
      return this.props.onSelectFiles(progressItems)
    }
    Promise.all(progressItems.map(item => {
      return readExif(item.file)
        .then(exif => {
          return exif ? Object.assign(item, {exif}) : item
        })
        .catch(error => {
          // Exif read failed, we do not want to fail hard
          error.message = `Exif read failed, continuing anyway: ${error.message}`
          console.error(error) // eslint-disable-line no-console
          return item
        })
        .then(it => {
          if (!('exif' in it) || !('orientation' in it.exif)) {
            // No exif or exif orientation available. Just return the blob url of the image file
            return Object.assign(it, {
              previewUrl: window.URL.createObjectURL(it.file)
            })
          }
          return rotateImage(it.file, it.exif).then(url => {
            return Object.assign(it, {previewUrl: url})
          })
        })
    }))
      .then(items => {
        this.props.onSelectFiles(items)
      })
  },
  render() {
    return (
      <FileUploader {...this.props}
        className={this.props.className + ' image-uploader'}
        onSelectFiles={this.handleSelectFiles}
      />
    )
  }
})
