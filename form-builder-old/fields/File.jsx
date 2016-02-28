import React from 'react'
import FileField from '../../inputs/FileField'
import Dispatchable from '../../../lib/mixins/Dispatchable'
import FormBuilderField from '../FormBuilderFieldMixin'
import path from 'path'

function titleifyFilename(filename) {
  return path.basename(filename, path.extname(filename)).replace(/[^a-zæøåÆØÅ0-9]+/ig, ' ')
}

export default React.createClass({
  displayName: 'File',
  mixins: [Dispatchable, FormBuilderField],

  actions: {
    UPLOAD_PROGRESSED({id, progress: progressEvent}) {
      if (!this.state.uploadProgress || this.state.uploadProgress.id !== id) {
        return
      }
      this.setState({
        uploadProgress: Object.assign(this.state.uploadProgress, {progress: progressEvent.percent})
      })
      if (progressEvent.status === 'completed') {
        this.setFieldValue('file', progressEvent.metadata)
      }
    }
  },
  getInitialState() {
    return {
      uploadProgress: null
    }
  },
  handleChange(newValue) {
    this._setValue(newValue)
  },

  handleSelectFile(progress) {
    this.setState({
      uploadProgress: progress,
      newFile: {
        type: 'file',
        path: this.props.document.path,
        _tempId: 'new_file_' + Math.random().toString(36).substring(2),
        fileName: progress.file.name
      }
    })

    const fileName = progress.file.name

    const extname = path.extname(fileName)
    const basename = extname ? path.basename(fileName, extname) : ''

    const title = (basename && titleifyFilename(basename)) || ''

    this._setValue({
      title: title,
      fileName: fileName
    })

    this.appDispatcher.uploadFile({
      id: progress.id,
      path: this.props.document.path,
      file: progress.file
    })
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

  render() {

    return (
      <div className="form-builder__file form-builder__field">
        <label className="form-builder__label">
          <p>{this.props.field.title}</p>
        </label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }

        <div className='form-builder__item'>
          <FileField
            {...this.props}
            value={this._getValue()}
            onChange={this.handleChange}
            onSelectFile={this.handleSelectFile}
            uploadProgress={this.state.uploadProgress}/>
        </div>
      </div>
    )
  }
})
