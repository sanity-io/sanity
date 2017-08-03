import PropTypes from 'prop-types'
import React from 'react'
import FileInput from 'part:@sanity/components/fileinput/default'
import styles from './styles/ImageSelect.css'
import DropZone from 'part:@sanity/components/fileinput/dropzone'
import UploadIcon from 'part:@sanity/base/upload-icon'

// todo: investigate if we can use web workers to do the heavy work on the images here

export default class ImageInput extends React.PureComponent {
  static propTypes = {
    onSelect: PropTypes.func.isRequired,
    processFiles: PropTypes.func,
    className: PropTypes.string,
    dropzone: PropTypes.bool
  }

  handleSelect = files => {

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
