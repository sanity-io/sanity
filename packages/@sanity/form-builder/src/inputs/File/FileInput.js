import React, {PropTypes} from 'react'
import FileSelect from './FileSelect'
import {omit, uniqueId} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import ObjectValueContainer from '../Object/ObjectContainer'

export default class FileInput extends React.PureComponent {
  static propTypes = {
    onChange: PropTypes.func,
    upload: PropTypes.func.isRequired,
    value: PropTypes.object.isRequired,
  }
  static valueContainer = ObjectValueContainer

  state = {
    status: 'ready',
    error: null,
    progress: null,
    uploadingFile: null,
  }

  subscription = null

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

  createSetIfMissingPatch() {
    return {
      type: 'setIfMissing',
      value: {
        _type: this.props.value.context.field.type,
        asset: {}
      }
    }
  }

  handleUploadProgress = event => {
    if (event.type === 'progress' && event.stage === 'upload') {
      this.setState({
        status: 'pending',
        progress: {percent: event.percent}
      })
    }

    if (event.type === 'complete') {
      const {onChange} = this.props
      onChange({
        patch: this.createSetIfMissingPatch()
      })
      onChange({
        patch: {
          type: 'set',
          path: ['asset'],
          value: {_ref: event.id}
        }
      })
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
    const {field, level, value, fieldName, ...rest} = omit(this.props,
      'upload',
      'onChange',
      'onEnter',
      'validation', // todo
      'focus' // todo
    )
    const inputId = uniqueId('FormBuilderText')
    return (
      <FormField label={field.title} labelHtmlFor={inputId} level={level}>
        {status && <h2>{status}</h2>}
        {uploadingFile && <b>Uploading {uploadingFile.name}</b>}
        {progress && <pre>{JSON.stringify(progress)}</pre>}
        {value && <pre>{JSON.stringify(value)}</pre>}
        <FileSelect
          name={fieldName}
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
