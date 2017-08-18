// @flow
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import Button from 'part:@sanity/components/buttons/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import {get, uniqueId, omit} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import ProgressBar from 'part:@sanity/components/progress/bar'
import PropTypes from 'prop-types'
import React from 'react'
import {groupBy} from 'lodash'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import styles from './styles/FileInput.css'
import subscriptionManager from '../../utils/subscriptionManager'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import Field from '../Object/Field'
import EditIcon from 'part:@sanity/base/edit-icon'

function getInitialState() {
  return {
    status: 'ready',
    error: null,
    progress: null,
    uploadingFile: null,
    materializedFile: null,
    isAdvancedEditOpen: false
  }
}

export default class FileInput extends React.PureComponent {
  _unmounted: boolean
  static propTypes = {
    value: PropTypes.object,
    type: PropTypes.object.isRequired,
    level: PropTypes.number,
    onChange: PropTypes.func,
    materializeReference: PropTypes.func.isRequired,
    upload: PropTypes.func.isRequired,
  }

  state = getInitialState()

  subscriptions = subscriptionManager('upload', 'materialize')

  _inputId = uniqueId('FileInput')

  componentDidMount() {
    const {value} = this.props
    if (value) {
      this.syncFileRef(value.asset)
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe('materialize')
    // todo: fix this properly by unsubscribing to upload observable without cancelling it
    this._unmounted = true
  }

  componentWillReceiveProps(nextProps) {
    const currentRef = get(this.props, 'value.asset')
    const nextRef = get(nextProps, 'value.asset')

    const shouldUpdate = currentRef !== nextRef && get(currentRef, '_ref') !== get(nextRef, '_ref')

    if (shouldUpdate) {
      this.setState(omit(getInitialState(), 'materializedFile', 'uploadingFile'))
      this.cancelCurrent()
      this.syncFileRef(nextRef)
    }
  }

  upload(file) {
    this.cancelCurrent()
    this.setState({uploadingFile: file})

    this.subscription = this.props.upload(file).subscribe({
      next: this.handleUploadProgress,
      error: this.handleUploadError
    })
  }

  cancelCurrent() {
    this.subscriptions.unsubscribe('upload')
  }

  syncFileRef(reference) {
    if (!reference) {
      this.setState({materializedFile: null})
      return
    }
    if (this.state.materializedFile && this.state.materializedFile._id === reference._id) {
      return
    }
    const {materializeReference} = this.props
    this.subscriptions.replace('materialize', materializeReference(reference._ref).subscribe(materialized => {
      this.setState({materializedFile: materialized})
    }))
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
    this.cancelCurrent()
    this.setState({
      status: 'cancelled',
      error: null,
      progress: {},
      uploadingFile: null
    })
  }
  handleStartAdvancedEdit = () => {
    this.setState({isAdvancedEditOpen: true})
  }
  handleStopAdvancedEdit = event => {
    this.setState({isAdvancedEditOpen: false})
  }

  handleFieldChange = (event: PatchEvent, field) => {
    const {onChange, type} = this.props

    onChange(event
      .prefixAll(field.name)
      .prepend(setIfMissing({
        _type: type.name,
        asset: {_type: 'reference'}
      })))
  }

  handleRemoveButtonClick = event => {
    this.props.onChange(
      PatchEvent.from(unset())
    )
  }

  renderAdvancedEdit(fields) {
    return (
      <Dialog title="Edit details" onClose={this.handleStopAdvancedEdit} isOpen>
        <div>
          {this.renderFields(fields)}
        </div>
        <Button onClick={this.handleStopAdvancedEdit}>Close</Button>
      </Dialog>
    )
  }

  renderFields(fields) {
    return (
      <div className={styles.fields}>
        {fields.map(field => this.renderField(field))}
      </div>
    )
  }

  renderField(field) {
    const {value, validation, level} = this.props
    const fieldValidation = validation && validation.fields[field.name]

    const fieldValue = value && value[field.name]

    return (
      <Field
        key={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        validation={fieldValidation}
        level={level + 1}
      />
    )
  }

  render() {
    // TODO: Render additional fields
    const {status, progress, uploadingFile, materializedFile, isAdvancedEditOpen} = this.state
    const {
      type,
      level,
      value
    } = this.props

    let progressClasses = ''

    if (status === 'complete') {
      progressClasses = styles.progressBarCompleted
    } else if (status === 'pending') {
      progressClasses = styles.progressBar
    } else {
      progressClasses = styles.progressBarIdle
    }

    const fieldGroups = Object.assign({asset: [], highlighted: [], other: []}, groupBy(type.fields, field => {
      if (field.name === 'asset') {
        return 'asset'
      }
      const options = field.type.options || {}
      if (options.isHighlighted) {
        return 'highlighted'
      }
      return 'other'
    }))

    return (
      <FormField label={type.title} labelFor={this._inputId} level={level}>
        <div className={styles.wrapper}>
          <div className={progressClasses}>
            {
              ((progress && uploadingFile) || (status === 'complete')) && (
                <ProgressBar
                  percent={status === 'complete' ? 100 : progress.percent}
                  text={status === 'complete' ? 'Complete' : `Uploading "${uploadingFile.name}"`}
                  showPercent
                  animation
                  completed={status === 'complete'}
                />
              )
            }
          </div>

          {value && fieldGroups.highlighted.length > 0 && this.renderFields(fieldGroups.highlighted)}

          {materializedFile && (
            <AnchorButton href={materializedFile.url} download>Download</AnchorButton>
          )}

          <FileInputButton
            onSelect={this.handleSelect}
          >
            {materializedFile ? 'Replace file…' : 'Select file…'}
          </FileInputButton>

          {value && fieldGroups.other.length > 0 && (
            <Button
              icon={EditIcon}
              title="Edit details"
              onClick={this.handleStartAdvancedEdit}
            >
              Edit…
            </Button>
          )}

          {value && value.asset && (
            <Button color="danger" onClick={this.handleRemoveButtonClick}>Remove</Button>
          )}
          {uploadingFile && (
            <Button
              kind="simple"
              color="danger"
              onClick={this.handleCancel}
            >
              Cancel
            </Button>
          )}
          {isAdvancedEditOpen && this.renderAdvancedEdit(fieldGroups.highlighted.concat(fieldGroups.other))}
        </div>
      </FormField>
    )
  }
}
