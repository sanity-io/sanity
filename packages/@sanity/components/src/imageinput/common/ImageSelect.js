import PropTypes from 'prop-types'
import React from 'react'
import FileInput from 'part:@sanity/components/fileinput/default'
import styles from './styles/ImageSelect.css'
import DropZone from 'part:@sanity/components/fileinput/dropzone'
import UploadIcon from 'part:@sanity/base/upload-icon'

export default class ImageInput extends React.PureComponent {
  static propTypes = {
    onSelect: PropTypes.func.isRequired,
    className: PropTypes.string,
    dropzone: PropTypes.bool
  }

  handleSelect = files => {
    const {onSelect} = this.props
    // Todo: fix this so it just emits the raw files.
    onSelect(Array.from(files).map(file => ({
      previewUrl: window.URL.createObjectURL(file),
      file
    })))
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
