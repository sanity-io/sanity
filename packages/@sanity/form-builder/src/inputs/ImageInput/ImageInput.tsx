/* eslint-disable complexity */

import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import EditIcon from 'part:@sanity/base/edit-icon'
import UploadIcon from 'part:@sanity/base/upload-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import {get, partition} from 'lodash'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import styles from './styles/ImageInput.css'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {Marker, Reference, Type} from '../../typedefs'
import {ResolvedUploader, Uploader, UploaderResolver} from '../../sanity/uploads/typedefs'
import WithMaterializedReference from '../../utils/WithMaterializedReference'
import ImageToolInput from '../ImageToolInput'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import SelectAsset from './SelectAsset'
import {FormBuilderInput} from '../../FormBuilderInput'
import UploadPlaceholder from '../common/UploadPlaceholder'
import UploadTargetFieldset from '../../utils/UploadTargetFieldset'
import Snackbar from 'part:@sanity/components/snackbar/default'
import ImageTool from '@sanity/imagetool'
import {Observable} from 'rxjs'
import {Path} from '../../typedefs/path'

type FieldT = {
  name: string
  type: Type
}

interface Value {
  _upload?: any
  asset?: Reference
  hotspot?: any
  crop?: any
}

export type Props = {
  value?: Value
  type: Type
  level: number
  onChange: (arg0: PatchEvent) => void
  resolveUploader: UploaderResolver
  materialize: (arg0: string) => Observable<Record<string, any>>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean | null
  focusPath: Array<any>
  markers: Array<Marker>
}

const HIDDEN_FIELDS = ['asset', 'hotspot', 'crop']
const getDevicePixelRatio = () => {
  if (typeof window === 'undefined' || !window.devicePixelRatio) {
    return 1
  }
  return Math.round(Math.max(1, window.devicePixelRatio))
}
type ImageInputState = {
  isUploading: boolean
  uploadError: Error | null
  isAdvancedEditOpen: boolean
  isSelectAssetOpen: boolean
  hasFocus: boolean
}
export default class ImageInput extends React.PureComponent<Props, ImageInputState> {
  _focusArea: any
  uploadSubscription: any
  state = {
    isUploading: false,
    uploadError: null,
    isAdvancedEditOpen: false,
    isSelectAssetOpen: false,
    hasFocus: false
  }
  handleRemoveButtonClick = (event: React.SyntheticEvent<any>) => {
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
        console.error(err)
        this.setState({uploadError: err})
        this.clearUploadStatus()
      },
      complete: () => {
        onChange(PatchEvent.from([unset(['hotspot']), unset(['crop'])]))
        this.setState({isUploading: false})
      }
    })
  }

  getConstrainedImageSrc = (assetDocument: Record<string, any>): string => {
    const materializedSize = ImageTool.maxWidth || 1000
    const maxSize = materializedSize * getDevicePixelRatio()
    const constrainedSrc = `${assetDocument.url}?w=${maxSize}&h=${maxSize}&fit=max`
    return constrainedSrc
  }
  renderMaterializedAsset = (assetDocument: Record<string, any>) => {
    const {value = {}} = this.props
    const constrainedSrc = this.getConstrainedImageSrc(assetDocument)
    const srcAspectRatio = get(assetDocument, 'metadata.dimensions.aspectRatio')
    return typeof srcAspectRatio === 'undefined' ? null : (
      <HotspotImage
        aspectRatio="auto"
        src={constrainedSrc}
        srcAspectRatio={srcAspectRatio}
        hotspot={value.hotspot}
        crop={value.crop}
      />
    )
  }

  renderUploadState(uploadState: any) {
    const {isUploading} = this.state
    const isComplete =
      uploadState.progress === 100 && !!(this.props.value && this.props.value.asset)
    return (
      <div className={styles.progress}>
        <div>
          <div>
            <ProgressCircle
              percent={status === 'complete' ? 100 : uploadState.progress}
              text={isComplete ? 'Please wait…' : 'Uploading…'}
              completed={isComplete}
              showPercent
              animation
            />
          </div>
          {isUploading && (
            <Button kind="simple" color="danger" onClick={this.handleCancelUpload}>
              Cancel
            </Button>
          )}
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
  handleOpenSelectAsset = () => {
    this.setState({
      isSelectAssetOpen: true
    })
  }
  handleCloseSelectAsset = () => {
    this.setState({
      isSelectAssetOpen: false
    })
  }
  handleSelectAsset = (asset: Record<string, any>) => {
    const {onChange, type} = this.props
    onChange(
      PatchEvent.from([
        setIfMissing({
          _type: type.name
        }),
        unset(['hotspot']),
        unset(['crop']),
        set(
          {
            _type: 'reference',
            _ref: asset._id
          },
          ['asset']
        )
      ])
    )
    this.setState({
      isSelectAssetOpen: false
    })
  }

  isImageToolEnabled() {
    return get(this.props.type, 'options.hotspot') === true
  }

  renderAdvancedEdit(fields: Array<FieldT>) {
    const {value, level, type, onChange, readOnly, materialize} = this.props
    return (
      <Dialog title="Edit details" onClose={this.handleStopAdvancedEdit} isOpen>
        {this.isImageToolEnabled() && value && value.asset && (
          <WithMaterializedReference materialize={materialize} reference={value.asset}>
            {imageAsset => (
              <ImageToolInput
                type={type}
                level={level}
                readOnly={readOnly}
                imageUrl={this.getConstrainedImageSrc(imageAsset)}
                value={value}
                onChange={onChange}
              />
            )}
          </WithMaterializedReference>
        )}
        <div className={styles.advancedEditFields}>{this.renderFields(fields)}</div>
        <Button onClick={this.handleStopAdvancedEdit}>Close</Button>
      </Dialog>
    )
  }

  renderFields(fields: Array<FieldT>) {
    return fields.map(field => this.renderField(field))
  }

  renderField(field: FieldT) {
    const {value, level, focusPath, onFocus, readOnly, onBlur} = this.props
    const fieldValue = value && value[field.name]
    return (
      <div className={styles.field} key={field.name}>
        <FormBuilderInput
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
      </div>
    )
  }

  focus() {
    if (this._focusArea) {
      this._focusArea.focus()
    }
  }

  handleFocus = (path: Path) => {
    this.setState({
      hasFocus: true
    })
    this.props.onFocus(path)
  }
  handleBlur = event => {
    this.props.onBlur()
    this.setState({
      hasFocus: false
    })
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
    const {type, value, level, materialize, markers, readOnly} = this.props
    const {isAdvancedEditOpen, isSelectAssetOpen, uploadError, hasFocus} = this.state
    const [highlightedFields, otherFields] = partition(
      type.fields.filter(field => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )
    const accept = get(type, 'options.accept', 'image/*')
    const hasAsset = value && value.asset
    const showAdvancedEditButton =
      value && (otherFields.length > 0 || (hasAsset && this.isImageToolEnabled()))
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
            {hasAsset ? (
              <WithMaterializedReference reference={value.asset} materialize={materialize}>
                {this.renderMaterializedAsset}
              </WithMaterializedReference>
            ) : readOnly ? (
              <span>Field is read only</span>
            ) : (
              <UploadPlaceholder hasFocus={hasFocus} />
            )}
          </div>
        </div>
        <div className={styles.functions}>
          <ButtonGrid>
            {!readOnly && (
              <FileInputButton
                icon={UploadIcon}
                inverted
                onSelect={this.handleSelectFile}
                accept={accept}
              >
                Upload
              </FileInputButton>
            )}
            {!readOnly && (
              <Button onClick={this.handleOpenSelectAsset} inverted>
                Browse
              </Button>
            )}
            {showAdvancedEditButton && (
              <Button
                icon={readOnly ? VisibilityIcon : EditIcon}
                inverted
                title={readOnly ? 'View details' : 'Edit details'}
                onClick={this.handleStartAdvancedEdit}
              >
                {readOnly ? 'View details' : 'Edit'}
              </Button>
            )}
            {hasAsset && !readOnly && (
              <Button color="danger" inverted onClick={this.handleRemoveButtonClick}>
                Remove
              </Button>
            )}
          </ButtonGrid>
        </div>
        {highlightedFields.length > 0 && (
          <div className={styles.fieldsWrapper}>{this.renderFields(highlightedFields)}</div>
        )}
        {isAdvancedEditOpen && this.renderAdvancedEdit(otherFields)}
        {isSelectAssetOpen && (
          <Dialog title="Select image" onClose={this.handleCloseSelectAsset} isOpen>
            <SelectAsset onSelect={this.handleSelectAsset} />
          </Dialog>
        )}
      </UploadTargetFieldset>
    )
  }
}
