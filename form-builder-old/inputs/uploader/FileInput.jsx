import React from 'react'
import _t from '../../../lib/translate'._t


export default React.createClass({
  displayName: 'FileUploader',
  propTypes: {
    multiple: React.PropTypes.bool,
    onSelectFiles: React.PropTypes.func
  },
  handleSelectFiles(e) {
    if (this.props.onSelectFiles) {
      this.props.onSelectFiles(e.target.files, e)
    }
  },
  render() {
    return (
      <div className="file-input" {...this.props}>
        <span className="text">
          {_t('formBuilder.fields.file.selectFile')}
        </span>
        <input type="file" name="file" value="" onChange={this.handleSelectFiles} multiple={this.props.multiple}/>
      </div>
    )
  }
})
