/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import Button from 'part:@sanity/components/buttons/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import EditIcon from 'part:@sanity/base/edit-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import FileIcon from 'part:@sanity/base/file-icon'
import UploadIcon from 'part:@sanity/base/upload-icon'
import {get, partition} from 'lodash'
import PatchEvent, {setIfMissing, unset} from '../../PatchEvent'
import styles from './styles/FileInput.css'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import {Marker, Reference, Type} from '../../typedefs'
import {ResolvedUploader, Uploader, UploaderResolver} from '../../sanity/uploads/typedefs'
import WithMaterializedReference from '../../utils/WithMaterializedReference'
import {FormBuilderInput} from '../../FormBuilderInput'
import UploadPlaceholder from '../common/UploadPlaceholder'
import UploadTargetFieldset from '../../utils/UploadTargetFieldset'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {Path} from '../../typedefs/path'
import {Observable} from 'rxjs'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'

type FieldT = {
  name: string
  type: Type
}
type Value = {
  _upload?: any
  asset?: Reference
  hotspot?: Record<string, any>
  crop?: Record<string, any>
}
export type Props = {
  value?: Value
  type: Type
  level: number
  onChange: (arg0: PatchEvent) => void
  resolveUploader: UploaderResolver
  materialize: (arg0: string) => Observable<any>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean | null
  focusPath: Array<any>
  markers: Array<Marker>
  presence: any
}

const HIDDEN_FIELDS = ['asset', 'hotspot', 'crop']
type FileInputState = {
  isUploading: boolean
  uploadError: Error | null
  isAdvancedEditOpen: boolean
  hasFocus: boolean
}

export default class FileInput extends React.PureComponent<Props, FileInputState> {
  static contextTypes = {
    getValuePath: PropTypes.func
  }

  _focusArea: any
  uploadSubscription: any
  state = {
    isUploading: false,
    isAdvancedEditOpen: false,
    uploadError: null,
    hasFocus: false
  }
  handleRemoveButtonClick = (event: React.SyntheticEvent<any>) => {
    const {getValuePath} = this.context
    const {value} = this.props
    const parentPathSegment = getValuePath().slice(-1)[0]

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    const isArrayElement = typeof parentPathSegment !== 'string'

    // When removing the file, _type and _key are "meta"-properties and
    // are not significant unless other properties are present. Thus, we
    // want to remove the entire "container" object if these are the only
    // properties present, BUT only if we're not an array element, as
    // removing the array element will close the selection dialog. Instead,
    // when closing the dialog, the array logic will check for an "empty"
    // value and remove it for us
    const allKeys = Object.keys(value)
    const remainingKeys = allKeys.filter(
      key => !['_type', '_key', '_upload', 'asset'].includes(key)
    )

    const isEmpty = remainingKeys.length === 0
    const removeKeys = ['asset']
      .concat(allKeys.filter(key => ['_upload'].includes(key)))
      .map(key => unset([key]))

    this.props.onChange(PatchEvent.from(isEmpty && !isArrayElement ? unset() : removeKeys))
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
    let match: {
      uploader: Uploader
      file: File
    } | null
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
    const options = {
      metadata: get(type, 'options.metadata'),
      storeOriginalFilename: get(type, 'options.storeOriginalFilename')
    }
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

  renderMaterializedAsset = (assetDocument: Record<string, any>) => {
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
          <div>
            <ProgressCircle
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

  renderSelectFileButton() {
    // Single asset source (just a normal button)
    return (
      <Button onClick={() => console.log('add select handling here')} inverted>
        Select
      </Button>
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
    this.props.onBlur()
  }

  renderField(field: FieldT) {
    const {value, level, focusPath, onFocus, readOnly, onBlur, presence} = this.props
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
        presence={presence}
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

  setFocusArea = (el: any | null) => {
    this._focusArea = el
  }
  getUploadOptions = (file: File): Array<ResolvedUploader> => {
    const {type, resolveUploader} = this.props
    const uploader = resolveUploader && resolveUploader(type, file)
    return uploader ? [{type: type, uploader}] : []
  }
  handleUpload = ({file, uploader}) => {
    this.uploadWith(uploader, file)
  }

  render() {
    const {type, value, level, markers, readOnly, presence} = this.props
    const {isAdvancedEditOpen, uploadError} = this.state
    const [highlightedFields, otherFields] = partition(
      type.fields.filter(field => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )
    const accept = get(type, 'options.accept', '')
    const hasAsset = value && value.asset

    const isInside = presence
      .map(item => {
        const otherFieldsPath = otherFields.map(field => field.name)
        return item.path.some(path => otherFieldsPath.includes(path)) ? item.identity : null
      })
      .filter(String)

    return (
      <UploadTargetFieldset
        markers={markers}
        legend={type.title}
        description={type.description}
        level={level}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onUpload={this.handleUpload}
        getUploadOptions={this.getUploadOptions}
        ref={this.setFocusArea}
        presence={presence.filter(item => item.path[0] === '$' || isInside.includes(item.identity))}
      >
        {uploadError && (
          <Snackbar
            kind="error"
            isPersisted
            actionTitle="OK"
            onAction={() => this.setState({uploadError: null})}
            title="Upload error"
            subtitle={<div>{"We're"} really sorry, but the upload could not be completed.</div>}
          />
        )}
        <div className={styles.content}>
          <div className={styles.assetWrapper}>
            {value && value._upload && (
              <div className={styles.uploadState}>{this.renderUploadState(value._upload)}</div>
            )}
            {this.renderAsset()}
          </div>
        </div>
        <div className={styles.functions}>
          <ButtonGrid>
            {!readOnly && (
              <FileInputButton
                inverted
                icon={UploadIcon}
                onSelect={this.handleSelectFile}
                accept={accept}
              >
                Upload
              </FileInputButton>
            )}
            {/* Enable when selecting already uploaded files is possible */}
            {/* {!readOnly && this.renderSelectFileButton()} */}
            {value && otherFields.length > 0 && (
              <Button
                icon={readOnly ? VisibilityIcon : EditIcon}
                kind="simple"
                title={readOnly ? 'View details' : 'Edit details'}
                onClick={this.handleStartAdvancedEdit}
              >
                {readOnly ? 'View details' : 'Edit'}
              </Button>
            )}
            {!readOnly && hasAsset && (
              <Button color="danger" inverted onClick={this.handleRemoveButtonClick}>
                Remove
              </Button>
            )}
            {isAdvancedEditOpen && this.renderAdvancedEdit(otherFields)}
          </ButtonGrid>
        </div>
        {highlightedFields.length > 0 && (
          <div className={styles.fieldsWrapper}>{this.renderFields(highlightedFields)}</div>
        )}
      </UploadTargetFieldset>
    )
  }
}
