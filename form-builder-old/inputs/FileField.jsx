

import React from 'react'

import ProgressTracker from './uploader/ProgressTracker'
import Button from './../Button'
import FileUploader from './uploader/FileUploader'
import path from 'path'
import ControlledValue from '../mixins/ControlledValue.js'

export default React.createClass({
  displayName: 'FileField',
  mixins: [ControlledValue],
  propTypes: {
    onSelectFile: React.PropTypes.func
  },
  handleSelectFiles(progressItems) {
    const progress = progressItems[0]
    if (this.props.onSelectFile) {
      this.props.onSelectFile(progress)
    }
  },
  mergeValueChange(valueField, newValue) {
    const change = {}
    change[valueField] = newValue
    return this.mergeChanges(change)
  },
  mergeChanges(changes) {
    return Object.assign({}, this._getValue() || {}, changes)
  },
  setFieldValue(valueField, newValue) {
    this._setValue(this.mergeValueChange(valueField, newValue))
  },
  handleFieldChange(field) {
    return (e) => {
      this.setFieldValue(field, e.target.value)
    }
  },
  handleRemove() {
    this._setValue(null)
  },
  render() {
    const hasValue = this._getValue()
    const value = hasValue || {}
    const url = value.file && value.file.original

    const extname = path.extname(value.fileName) || value.fileName
    const basename = extname ? path.basename(value.fileName, extname) : ''
    const handleFilenameChange = e => this.setFieldValue('fileName', e.target.value + extname)

    return (
      <fieldset className="file-field">
        {this.props.uploadProgress && <ProgressTracker progress={this.props.uploadProgress}/>}
        {!hasValue && (
          <div className="form-group">
            <FileUploader onSelectFiles={this.handleSelectFiles}/>
          </div>
        )}
        {(hasValue || this.props.uploadProgress) && (
          <div>
            <div className="form-group">
              <label>Tittel</label>
              <input type="text" className="form-control" value={value.title} name="title" onChange={this.handleFieldChange('title')}/>
            </div>
            <div className="form-group">
              <label>Filnavn</label>
              <input
                type="text"
                style={{width: '70%'}}
                className="form-control"
                value={basename || ''}
                name="fileName"
                onChange={handleFilenameChange}
                placeholder="Filnavn"/>
              <span style={{marginLeft: 2}}>{extname}</span>
            </div>
          </div>
        )}
        {hasValue && (
          <div>
            <div className="form-group">
              {value.title} (<a href={url} target="_blank">{value.fileName}</a>)
            </div>
            <div className="form-group">
              Velg en annen fil: <FileUploader onSelectFiles={this.handleSelectFiles}/>
            </div>
            <div className="form-group">
              <Button type="button" className="negative" onClick={this.handleRemove}>Fjern fil</Button>
            </div>
          </div>
        )}
      </fieldset>
    )
  }
})
