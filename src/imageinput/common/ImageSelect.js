import React, {PropTypes} from 'react'
import FileSelect from '../../fileinput/common/FileSelect'
import readExif from '../utils/readExif'
import rotateImage from '../utils/rotateImage'
import continueWhen from '../utils/continueWhen'
import styles from './styles/ImageSelect.css'

// todo: investigate if we can use web workers to do the heavy work on the images here

export default class ImageInput extends React.PureComponent {
  static propTypes = {
    onSelect: PropTypes.func.isRequired
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
    return (
      <FileSelect
        {...this.props}
        className={styles.root}
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
