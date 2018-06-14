/* eslint-disable complexity */
import type {Node} from 'react'
// @flow
import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import ProgressBar from 'part:@sanity/components/progress/bar'
import EditIcon from 'part:@sanity/base/edit-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import FileIcon from 'part:@sanity/base/file-icon'
import UploadIcon from 'part:@sanity/base/upload-icon'
import {get, partition} from 'lodash'
import PatchEvent, {setIfMissing, unset} from '../../PatchEvent'
import styles from './styles/FileInput.css'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import {ObservableI} from '../../typedefs/observable'

import type {Reference, Type} from '../../typedefs'
import type {Uploader, UploaderResolver} from '../../sanity/uploads/typedefs'

import WithMaterializedReference from '../../utils/WithMaterializedReference'
import {FormBuilderInput} from '../../FormBuilderInput'
import UploadPlaceholder from '../common/UploadPlaceholder'
import UploadTargetFieldset from '../../utils/UploadTargetFieldset'
import Snackbar from 'part:@sanity/components/snackbar/default'

type FieldT = {
  name: string,
  type: Type
}

type Value = {
  _upload?: any,
  asset?: Reference,
  hotspot?: Object,
  crop?: Object
}

type Props = {
  value?: Value,
  type: Type,
  level: number,
  onChange: PatchEvent => void,
  resolveUploader: UploaderResolver,
  materialize: string => ObservableI<Object>,
  onBlur: () => void,
  onFocus: () => void,
  readOnly: ?boolean,
  focusPath: Array<*>
}

type State = {
  isAdvancedEditOpen: boolean,
  isUploading: boolean
}

const HIDDEN_FIELDS = ['asset', 'hotspot', 'crop']

export default class FileInput extends React.PureComponent<Props, State> {
  uploadSubscription: any
  state = {
    isUploading: false,
    isAdvancedEditOpen: false,
    uploadError: null
  }

  handleRemoveButtonClick = (event: SyntheticEvent<*>) => {
    this.props.onChange(PatchEvent.from(unset(['asset'])))
  }

  clearUploadStatus() {
    this.props.onChange(PatchEvent.from([unset(['_upload'])])) // todo: this is kind of hackish
  }

  cancelUpload() {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe()
      this.clearUploadStatus()
    }
  }

  handleCancelUpload = () => {
    this.cancelUpload()
  }

  handleSelectFile = (files: FileList) => {
    this.uploadFirstAccepted(files)
  }

  uploadFirstAccepted(fileList: FileList) {
    const {resolveUploader, type} = this.props

    let match: ?{uploader: Uploader, file: File}

    Array.from(fileList).some(file => {
      const uploader = resolveUploader(type, file)
      if (uploader) {
        match = {file, uploader}
        return true
      }
      return false
    })

    if (match) {
      this.uploadWith(match.uploader, match.file)
    }
  }

  uploadWith(uploader: Uploader, file: File) {
    const {type, onChange} = this.props
    const options = {metadata: get(type, 'options.metadata')}
    this.cancelUpload()
    this.setState({isUploading: true})
    onChange(PatchEvent.from([setIfMissing({_type: type.name})]))

    this.uploadSubscription = uploader.upload(file, type, options).subscribe({
      next: uploadEvent => {
        if (uploadEvent.patches) {
          onChange(PatchEvent.from(uploadEvent.patches))
        }
      },
      error: err => {
        this.setState({uploadError: err})
        this.clearUploadStatus()
      },
      complete: () => {
        onChange(PatchEvent.from([unset(['hotspot']), unset(['crop'])]))
        this.setState({isUploading: false})
      }
    })
  }

  renderMaterializedAsset = (assetDocument: Object): Node => {
    return (
      <div className={styles.previewAsset}>
        <div className={styles.fileIcon}>
          <FileIcon />
        </div>
        <div>
          {assetDocument.originalFilename}{' '}
          <a href={`${assetDocument.url}?dl`} download>
            Download
          </a>
        </div>
      </div>
    )
  }

  renderUploadState(uploadState: any) {
    const {isUploading} = this.state
    const isComplete = uploadState.progress === 100
    const filename = get(uploadState, 'file.name')
    return (
      <div className={styles.uploadState}>
        <div>
          <div className={isComplete ? styles.progressBarCompleted : styles.progressBar}>
            <ProgressBar
              percent={status === 'complete' ? 100 : uploadState.progress}
              text={isComplete ? 'Complete' : `Uploading${filename ? ` "${filename}"` : '...'}`}
              completed={isComplete}
              showPercent
              animation
            />
          </div>
          <div className={styles.cancelButton}>
            {isUploading && (
              <Button kind="simple" color="danger" onClick={this.handleCancelUpload}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  handleFieldChange = (event: PatchEvent, field: FieldT) => {
    const {onChange, type} = this.props

    onChange(
      event.prefixAll(field.name).prepend(
        setIfMissing({
          _type: type.name
        })
      )
    )
  }

  handleStartAdvancedEdit = () => {
    this.setState({isAdvancedEditOpen: true})
  }

  handleStopAdvancedEdit = () => {
    this.setState({isAdvancedEditOpen: false})
  }

  renderAdvancedEdit(fields: Array<FieldT>) {
    return (
      <Dialog title="Edit details" onClose={this.handleStopAdvancedEdit} isOpen>
        <div>{this.renderFields(fields)}</div>
        <Button onClick={this.handleStopAdvancedEdit}>Close</Button>
      </Dialog>
    )
  }

  renderFields(fields: Array<FieldT>) {
    return fields.map(field => this.renderField(field))
  }

  handleFocus = event => {
    this.setState({
      hasFocus: true
    })
    this.props.onFocus(event)
  }

  handleBlur = event => {
    this.setState({
      hasFocus: false
    })
    this.props.onBlur(event)
  }

  renderField(field: FieldT) {
    const {value, level, focusPath, onFocus, readOnly, onBlur} = this.props
    const fieldValue = value && value[field.name]

    return (
      <FormBuilderInput
        key={field.name}
        value={fieldValue}
        type={field.type}
        onChange={ev => this.handleFieldChange(ev, field)}
        path={[field.name]}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={readOnly || field.type.readOnly}
        focusPath={focusPath}
        level={level}
      />
    )
  }

  renderAsset() {
    const {value, materialize, readOnly} = this.props

    if (value && value.asset) {
      return (
        <WithMaterializedReference reference={value.asset} materialize={materialize}>
          {this.renderMaterializedAsset}
        </WithMaterializedReference>
      )
    }

    return readOnly ? (
      <span>Field is read only</span>
    ) : (
      <UploadPlaceholder hasFocus={this.state.hasFocus} />
    )
  }

  focus() {
    if (this._focusArea) {
      this._focusArea.focus()
    }
  }

  setFocusArea = (el: ?FocusArea) => {
    this._focusArea = el
  }

  getUploadOptions = (file: File): Array<UploadOption> => {
    const {type, resolveUploader} = this.props
    const uploader = resolveUploader && resolveUploader(type, file)
    return uploader ? [{type: type, uploader}] : []
  }

  handleUpload = ({file, uploader}) => {
    this.uploadWith(uploader, file)
  }

  render() {
    const {type, value, level, readOnly} = this.props

    const {isAdvancedEditOpen, uploadError} = this.state

    const [highlightedFields, otherFields] = partition(
      type.fields.filter(field => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )

    const hasAsset = value && value.asset

    return (
      <UploadTargetFieldset
        legend={type.title}
        description={type.description}
        level={level}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onUpload={this.handleUpload}
        getUploadOptions={this.getUploadOptions}
        ref={this.setFocusArea}
      >
        {uploadError && (
          <Snackbar
            kind="error"
            action={{title: 'OK'}}
            onAction={() => this.setState({uploadError: null})}
          >
            {"We're"} really sorry, but the upload could not be completed.
          </Snackbar>
        )}
        <div className={styles.content}>
          <div className={styles.assetWrapper}>
            {value &&
              value._upload && (
                <div className={styles.uploadState}>{this.renderUploadState(value._upload)}</div>
              )}
            {this.renderAsset()}
          </div>
          {highlightedFields.length > 0 && (
            <div className={styles.fieldsWrapper}>{this.renderFields(highlightedFields)}</div>
          )}
        </div>
        <div className={styles.functions}>
          {!readOnly && (
            <FileInputButton
              icon={UploadIcon}
              onSelect={this.handleSelectFile}
              accept={'' /* todo build from this.props.resolveUploaders */}
            >
              Upload
            </FileInputButton>
          )}
          {value &&
            otherFields.length > 0 && (
              <Button
                icon={readOnly ? VisibilityIcon : EditIcon}
                kind="simple"
                title={readOnly ? 'View details' : 'Edit details'}
                onClick={this.handleStartAdvancedEdit}
              >
                {readOnly ? 'View details' : 'Edit'}
              </Button>
            )}
          {!readOnly &&
            hasAsset && (
              <Button color="danger" kind="simple" onClick={this.handleRemoveButtonClick}>
                Remove
              </Button>
            )}
        </div>
        {isAdvancedEditOpen && this.renderAdvancedEdit(otherFields)}
      </UploadTargetFieldset>
    )
  }
}
