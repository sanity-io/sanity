import type {Node} from 'react'
// @flow
import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import ProgressBar from 'part:@sanity/components/progress/bar'
import EditIcon from 'part:@sanity/base/edit-icon'
import {get, partition} from 'lodash'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import styles from './styles/ImageInput.css'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import {ObservableI} from '../../typedefs/observable'

import type {Reference, Type} from '../../typedefs'
import type {Uploader, UploaderResolver} from '../../sanity/uploads/typedefs'

import WithMaterializedReference from '../../utils/WithMaterializedReference'
import ImageToolInput from '../ImageTool'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import SelectAsset from './SelectAsset'
import {FormBuilderInput} from '../../FormBuilderInput'
import UploadPlaceholder from '../common/UploadPlaceholder'
import UploadTargetFieldset from '../../utils/UploadTargetFieldset'

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
  onChange: (PatchEvent) => void,
  resolveUploader: UploaderResolver,
  materialize: (string) => ObservableI<Object>,
  onBlur: () => void,
  onFocus: () => void,
  focusPath: Array<*>
}

type State = {
  isAdvancedEditOpen: boolean,
  isUploading: boolean,
  isSelectAssetOpen: boolean
}

const HIDDEN_FIELDS = ['asset', 'hotspot', 'crop']

export default class ImageInput extends React.PureComponent<Props, State> {
  uploadSubscription: any
  state = {
    isUploading: false,
    isAdvancedEditOpen: false,
    isSelectAssetOpen: false
  }

  handleRemoveButtonClick = (event: SyntheticEvent<*>) => {
    this.props.onChange(
      PatchEvent.from(unset())
    )
  }

  cancelUpload() {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe()
      this.props.onChange(PatchEvent.from([unset(['_upload'])])) // todo: this is kind of hackish
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

    let match: ?{ uploader: Uploader, file: File }

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
    this.cancelUpload()
    this.setState({isUploading: true})
    onChange(PatchEvent.from([setIfMissing({_type: type.name})]))

    this.uploadSubscription = uploader.upload(file, type)
      .subscribe({
        next: uploadEvent => {
          if (uploadEvent.patches) {
            onChange(PatchEvent.from(uploadEvent.patches))
          }
        },
        complete: () => {
          onChange(
            PatchEvent.from([
              unset(['hotspot']),
              unset(['crop'])
            ])
          )
          this.setState({isUploading: false})
        }
      })
  }

  renderMaterializedAsset = (assetDocument: Object): Node => {
    const {value = {}} = this.props
    return (
      <HotspotImage
        aspectRatio="auto"
        src={assetDocument.url}
        srcAspectRatio={assetDocument.metadata.dimensions.aspectRatio}
        hotspot={value.hotspot}
        crop={value.crop}
      />
    )
  }

  renderUploadState(uploadState: any) {
    const {isUploading} = this.state
    const isComplete = uploadState.progress === 100
    const filename = get(uploadState, 'file.name')
    return (
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
        {isUploading && (
          <Button
            kind="simple"
            color="danger"
            onClick={this.handleCancelUpload}
          >
            Cancel
          </Button>
        )}
      </div>
    )
  }

  handleFieldChange = (event: PatchEvent, field: FieldT) => {
    const {onChange, type} = this.props

    onChange(event
      .prefixAll(field.name)
      .prepend(setIfMissing({
        _type: type.name,
        asset: {_type: 'reference'}
      })))
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

  handleSelectAsset = (asset: Object) => {
    const {onChange, type} = this.props
    onChange(PatchEvent.from([
      setIfMissing({
        _type: type.name
      }),
      unset(['hotspot']),
      unset(['crop']),
      set({
        _type: 'reference',
        _ref: asset._id
      }, ['asset'])
    ]))

    this.setState({
      isSelectAssetOpen: false
    })
  }

  renderAdvancedEdit(fields: Array<FieldT>) {
    const {value, level, onChange, type, materialize} = this.props

    const isImageToolEnabled = get(type, 'options.hotspot') === true

    return (
      <Dialog title="Edit details" onClose={this.handleStopAdvancedEdit} isOpen>
        {isImageToolEnabled && value && value.asset && (
          <WithMaterializedReference materialize={materialize} reference={value.asset}>
            {imageAsset => <ImageToolInput level={level} imageUrl={imageAsset.url} value={value} onChange={onChange} />}
          </WithMaterializedReference>
        )}
        <div>
          {this.renderFields(fields)}
        </div>
        <Button onClick={this.handleStopAdvancedEdit}>Close</Button>
      </Dialog>
    )
  }

  renderFields(fields: Array<FieldT>) {
    return fields.map(field => this.renderField(field))
  }

  renderField(field: FieldT) {
    const {value, level, onBlur, focusPath, onFocus} = this.props
    const fieldValue = value && value[field.name]

    return (
      <FormBuilderInput
        value={fieldValue}
        type={field.type}
        onChange={ev => this.handleFieldChange(ev, field)}
        key={field.name}
        path={[field.name]}
        onFocus={onFocus}
        onBlur={onBlur}
        focusPath={focusPath}
        level={level}
      />
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
    const {type, value, level, onFocus, materialize} = this.props

    const {isAdvancedEditOpen, isSelectAssetOpen} = this.state

    const [highlightedFields, otherFields] = partition(
      type.fields.filter(field => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )

    return (
      <UploadTargetFieldset
        legend={type.title}
        description={type.description}
        level={level}
        onFocus={onFocus}
        className={styles.root}
        onUpload={this.handleUpload}
        getUploadOptions={this.getUploadOptions}
        ref={this.setFocusArea}
      >
        {value && value._upload && (
          <div className={styles.uploadState}>
            {this.renderUploadState(value._upload)}
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.assetWrapper}>
            {value && value.asset
              ? (
                <WithMaterializedReference reference={value.asset} materialize={materialize}>
                  {this.renderMaterializedAsset}
                </WithMaterializedReference>
              )
              : <UploadPlaceholder />}
          </div>
          {highlightedFields.length > 0 && (
            <div className={styles.fieldsWrapper}>
              {this.renderFields(highlightedFields)}
            </div>
          )}
        </div>
        <div className={styles.functions}>
          <FileInputButton
            onSelect={this.handleSelectFile}
            accept={''/* todo build from this.props.resolveUploaders */}
          >
            {value && value.asset ? 'Replace from disk…' : 'Select from disk…'}
          </FileInputButton>
          <Button onClick={this.handleOpenSelectAsset}>
            {value && value.asset ? 'Replace from library…' : 'Select from library…'}
          </Button>
          {value && otherFields.length > 0 && (
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
        </div>
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
