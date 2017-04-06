// @flow weak
import React, {PropTypes} from 'react'
import FileSelect from './FileSelect'
import {uniqueId} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import PatchEvent, {set, setIfMissing} from '../../PatchEvent'

export default class FileInput extends React.PureComponent {
  static propTypes = {
    value: PropTypes.object.isRequired,
    type: PropTypes.object.isRequired,
    level: PropTypes.number,
    onChange: PropTypes.func,
    upload: PropTypes.func.isRequired,
  }

  state = {
    status: 'ready',
    error: null,
    progress: null,
    uploadingFile: null,
  }

  subscription = null

  _inputId = uniqueId('FileInput')

  upload(file) {
    this.cancel()
    this.setState({uploadingFile: file})

    this.subscription = this.props.upload(file).subscribe({
      next: this.handleUploadProgress,
      error: this.handleUploadError
    })
  }

  componentWillUnmount() {
    this.cancel()
  }
  cancel() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  setRef(id) {
    this.props.onChange(PatchEvent.from(
      setIfMissing({
        _type: this.props.type.name,
        asset: {_type: 'reference'}
      }),
      set({_ref: id}, ['asset'])
    ))
  }

  handleUploadProgress = event => {
    if (event.type === 'progress' && event.stage === 'upload') {
      this.setState({
        status: 'pending',
        progress: {percent: event.percent}
      })
    }

    if (event.type === 'complete') {
      this.setRef(event.id)
      this.setState({
        uploadingFile: null,
        status: 'complete'
      })
    }
  }

  handleUploadError = error => {
    this.setState({
      status: 'error',
      error: error
    })
  }

  handleUploadComplete = () => {
    this.setState({
      status: 'complete'
    })
  }

  handleSelect = files => {
    this.upload(files[0])
  }

  handleCancel = () => {
    this.cancel()
    this.setState({
      status: 'cancelled',
      error: null,
      progress: null,
      uploadingFile: null
    })
  }

  render() {
    // TODO: Render additional fields
    const {status, progress, uploadingFile} = this.state
    const {
      type,
      level,
      value,
      upload,
      onChange,
      ...rest
    } = this.props

    return (
      <FormField label={type.title} labelHtmlFor={this._inputId} level={level}>
        {status && <h2>{status}</h2>}
        {uploadingFile && <b>Uploading {uploadingFile.name}</b>}
        {progress && <pre>{JSON.stringify(progress)}</pre>}
        {value && <pre>{JSON.stringify(value)}</pre>}
        <FileSelect
          onSelect={this.handleSelect}
          {...rest}
        >
          Upload {uploadingFile ? 'another' : 'a'} file…
        </FileSelect>
        {uploadingFile && <button onClick={this.handleCancel}>Cancel</button>}
      </FormField>
    )
  }
}
