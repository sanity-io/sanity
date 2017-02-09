import React, {PropTypes} from 'react'
import FileInput from 'part:@sanity/components/fileinput/default'
import readExif from '../utils/readExif'
import rotateImage from '../utils/rotateImage'
import continueWhen from '../utils/continueWhen'
import styles from './styles/ImageSelect.css'
import DropZone from 'part:@sanity/components/fileinput/dropzone'
import UploadIcon from 'part:@sanity/base/upload-icon'

// todo: investigate if we can use web workers to do the heavy work on the images here

export default class ImageInput extends React.PureComponent {
  static propTypes = {
    onSelect: PropTypes.func.isRequired,
    className: PropTypes.string,
    dropzone: PropTypes.bool
  }
  handleSelect = files => {
    this.processingFiles = files

    // Will turn `then`-callbacks into noops if user has selected new file(s) in the meantime
    const maybeContinue = continueWhen(() => this.processingFiles === files)

    Promise.all(Array.from(files).map(file => {
      return readExif(file)
        .then(exif => ({file, exif}))
        .catch(error => {
          // Exif read failed, we do not want to fail hard
          error.message = `Exif read failed, continuing anyway: ${error.message}`
          console.error(error) // eslint-disable-line no-console
          return {file, exif: null}
        })
        .then(maybeContinue(image => {
          return previewUrlWithCorrectedOrientation(image, (image.exif || {}).orientation)
            .then(previewUrl => {
              return {
                ...image,
                previewUrl: previewUrl
              }
            })
        }))
    }))
      .then(maybeContinue(this.props.onSelect))
  }

  render() {
    const {dropzone, ...rest} = this.props
    if (dropzone) {
      return (
        <DropZone {...rest} onDrop={this.handleSelect} icon={UploadIcon} />
      )
    }
    return (
      <FileInput
        {...rest}
        className={`${styles.root} ${this.props.className}`}
        onSelect={this.handleSelect}
      />
    )
  }
}

function previewUrlWithCorrectedOrientation(image, orientation) {
  return (orientation && orientation !== 'top-left')
    ? rotateImage(image.file, orientation)
    : Promise.resolve(window.URL.createObjectURL(image.file))
}
