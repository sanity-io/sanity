import React from 'react'
import PropTypes from 'prop-types'
import {Observable, Subscription} from 'rxjs'
import {get, partition} from 'lodash'
import classNames from 'classnames'
import {Marker, Path, File as BaseFile, FileAsset, SchemaType, FileSchemaType} from '@sanity/types'
import {ChangeIndicatorCompareValueProvider} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {ChangeIndicator} from '@sanity/base/lib/change-indicators'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import {EditIcon, EyeOpenIcon, BinaryDocumentIcon, UploadIcon} from '@sanity/icons'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {Button} from '@sanity/ui'
import UploadTargetFieldset from '../../utils/UploadTargetFieldset'
import WithMaterializedReference from '../../utils/WithMaterializedReference'
import {ResolvedUploader, Uploader, UploaderResolver} from '../../sanity/uploads/types'
import PatchEvent, {setIfMissing, unset} from '../../PatchEvent'
import {FormBuilderInput} from '../../FormBuilderInput'
import UploadPlaceholder from '../common/UploadPlaceholder'
import styles from './FileInput.css'

type FieldT = {
  name: string
  type: SchemaType
}

interface UploadState {
  progress: number
}

interface File extends Partial<BaseFile> {
  _upload?: UploadState
}

export type Props = {
  value?: File
  compareValue?: File
  type: FileSchemaType
  level: number
  onChange: (event: PatchEvent) => void
  resolveUploader: UploaderResolver
  materialize: (documentId: string) => Observable<FileAsset>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean | null
  focusPath: Path
  markers: Marker[]
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
    getValuePath: PropTypes.func,
  }

  _focusArea: any
  uploadSubscription: Subscription

  state: FileInputState = {
    isUploading: false,
    isAdvancedEditOpen: false,
    uploadError: null,
    hasFocus: false,
  }

  handleRemoveButtonClick = () => {
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
      (key) => !['_type', '_key', '_upload', 'asset'].includes(key)
    )

    const isEmpty = remainingKeys.length === 0
    const removeKeys = ['asset']
      .concat(allKeys.filter((key) => ['_upload'].includes(key)))
      .map((key) => unset([key]))

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
      file: globalThis.File
    } | null
    Array.from(fileList).some((file) => {
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

  uploadWith(uploader: Uploader, file: globalThis.File) {
    const {type, onChange} = this.props
    const options = {
      metadata: get(type, 'options.metadata'),
      storeOriginalFilename: get(type, 'options.storeOriginalFilename'),
    }
    this.cancelUpload()
    this.setState({isUploading: true})
    onChange(PatchEvent.from([setIfMissing({_type: type.name})]))
    this.uploadSubscription = uploader.upload(file, type, options).subscribe({
      next: (uploadEvent) => {
        if (uploadEvent.patches) {
          onChange(PatchEvent.from(uploadEvent.patches))
        }
      },
      error: (err) => {
        this.setState({uploadError: err})
        this.clearUploadStatus()
      },
      complete: () => {
        onChange(PatchEvent.from([unset(['hotspot']), unset(['crop'])]))
        this.setState({isUploading: false})
      },
    })
  }

  renderMaterializedAsset = (assetDocument: FileAsset) => {
    return (
      <div className={styles.previewAsset}>
        <div className={styles.fileIcon}>
          <BinaryDocumentIcon />
        </div>
        <div>
          <div className={styles.fileLabel}>{assetDocument.originalFilename}</div>
          <Button as="a" href={`${assetDocument.url}?dl`} mode="bleed" padding={2}>
            Download
          </Button>
        </div>
      </div>
    )
  }

  renderUploadState(uploadState: UploadState) {
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
              <Button mode="bleed" color="danger" onClick={this.handleCancelUpload} text="Cancel" />
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
          _type: type.name,
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

  handleClearUploadError = () => {
    this.setState({uploadError: null})
  }

  renderAdvancedEdit(fields: Array<FieldT>) {
    return (
      <Dialog title="Edit details" onClose={this.handleStopAdvancedEdit} isOpen>
        <div>{this.renderFields(fields)}</div>
      </Dialog>
    )
  }

  // eslint-disable-next-line class-methods-use-this
  renderSelectFileButton() {
    // Single asset source (just a normal button)
    // @todo add select handling here
    return <Button mode="bleed" text="Select" />
  }

  renderFields(fields: Array<FieldT>) {
    return fields.map((field) => this.renderField(field))
  }

  handleFocus = (event) => {
    this.setState({
      hasFocus: true,
    })
    this.props.onFocus(event)
  }

  handleBlur = () => {
    this.setState({
      hasFocus: false,
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
        onChange={(ev) => this.handleFieldChange(ev, field)}
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

  getUploadOptions = (file: globalThis.File): Array<ResolvedUploader> => {
    const {type, resolveUploader} = this.props
    const uploader = resolveUploader && resolveUploader(type, file)
    return uploader ? [{type: type, uploader}] : []
  }

  handleUpload = ({file, uploader}) => {
    this.uploadWith(uploader, file)
  }

  render() {
    const {type, value, compareValue, level, markers, readOnly, presence} = this.props
    const {isAdvancedEditOpen, uploadError, hasFocus} = this.state
    const [highlightedFields, otherFields] = partition(
      type.fields.filter((field) => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )
    const accept = get(type, 'options.accept', '')
    const hasAsset = value && value.asset

    const isInside = presence
      .map((item) => {
        const otherFieldsPath = otherFields.map((field) => field.name)
        return item.path.some((path) => otherFieldsPath.includes(path)) ? item.identity : null
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
        presence={presence.filter(
          (item) => item.path[0] === '$' || isInside.includes(item.identity)
        )}
        changeIndicator={false}
      >
        {uploadError && (
          <Snackbar
            kind="error"
            isPersisted
            actionTitle="OK"
            onAction={this.handleClearUploadError}
            title="Upload error"
            subtitle={<div>We're really sorry, but the upload could not be completed.</div>}
          />
        )}

        <div
          className={classNames(
            styles.root,
            readOnly && styles.readOnly,
            hasFocus && styles.focused
          )}
        >
          <ChangeIndicatorCompareValueProvider
            value={value?.asset?._ref}
            compareValue={compareValue?.asset?._ref}
          >
            <ChangeIndicator>
              <div className={styles.content}>
                <div className={styles.assetWrapper}>
                  {value && value._upload && (
                    <div className={styles.uploadState}>
                      {this.renderUploadState(value._upload)}
                    </div>
                  )}
                  {this.renderAsset()}
                </div>
              </div>
            </ChangeIndicator>
          </ChangeIndicatorCompareValueProvider>

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
                  icon={readOnly ? EyeOpenIcon : EditIcon}
                  mode="bleed"
                  title={readOnly ? 'View details' : 'Edit details'}
                  onClick={this.handleStartAdvancedEdit}
                  text={readOnly ? 'View details' : 'Edit'}
                />
              )}
              {!readOnly && hasAsset && (
                <Button
                  tone="critical"
                  mode="bleed"
                  onClick={this.handleRemoveButtonClick}
                  text="Remove"
                />
              )}
              {isAdvancedEditOpen && this.renderAdvancedEdit(otherFields)}
            </ButtonGrid>
          </div>
        </div>
        {highlightedFields.length > 0 && this.renderFields(highlightedFields)}
      </UploadTargetFieldset>
    )
  }
}
