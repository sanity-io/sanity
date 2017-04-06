// @flow weak
import Button from 'part:@sanity/components/buttons/default'
import {uniqueId} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import ProgressBar from 'part:@sanity/components/progress/bar'
import React, {PropTypes} from 'react'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import FileSelect from './FileSelect'
import styles from './styles/FileInput.css'

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
      progress: {},
      uploadingFile: null
    })
  }

  handleRemoveButtonClick = event => {
    this.props.onChange(
      PatchEvent.from(unset())
    )
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

    let progressClasses = ''

    if (status === 'complete') {
      progressClasses = styles.progressBarCompleted
    } else if (status === 'pending') {
      progressClasses = styles.progressBar
    } else {
      progressClasses = styles.progressBarIdle
    }

    return (
      <FormField label={type.title} labelHtmlFor={this._inputId} level={level}>
        <div className={progressClasses}>
          {
            ((progress && uploadingFile) || (status === 'complete')) && (
              <ProgressBar
                percent={progress.percent}
                text={status === 'complete' ? 'Complete' : `Uploading "${uploadingFile.name}"`}
                showPercent
                animation
                completed={status === 'complete'}
              />
            )
          }
        </div>
        <Button ripple={false} className={styles.button}>
          <FileSelect
            onSelect={this.handleSelect}
            {...rest}
          >
            Select file…
          </FileSelect>
        </Button>
        {
          value && value.asset && (
            <Button>Download</Button>
          )
        }
        {
          value && value.asset && (
            <Button color="danger" onClick={this.handleRemoveButtonClick}>Remove</Button>
          )
        }
        {uploadingFile && (
          <Button
            kind="simple"
            color="danger"
            onClick={this.handleCancel}
            className={styles.button}
          >
            Cancel
          </Button>
        )
        }
      </FormField>
    )
  }
}
