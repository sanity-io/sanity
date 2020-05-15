// Modules
import {get, partition} from 'lodash'
import {Observable} from 'rxjs'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import ImageTool from '@sanity/imagetool'
import React from 'react'
import PropTypes from 'prop-types'

// Parts
import assetSources from 'all:part:@sanity/form-builder/input/image/asset-source'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import EditIcon from 'part:@sanity/base/edit-icon'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import formBuilderConfig from 'config:@sanity/form-builder'
import ImageIcon from 'part:@sanity/base/image-icon'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import UploadIcon from 'part:@sanity/base/upload-icon'
import userDefinedAssetSources from 'part:@sanity/form-builder/input/image/asset-sources?'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'

// Package files
import {FormBuilderInput} from '../../FormBuilderInput'
import {Marker, Reference, Type} from '../../typedefs'
import {Path} from '../../typedefs/path'
import {ResolvedUploader, Uploader, UploaderResolver} from '../../sanity/uploads/typedefs'
import {urlToFile, base64ToFile} from './utils/image'
import ImageToolInput from '../ImageToolInput'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import Snackbar from 'part:@sanity/components/snackbar/default'
import styles from './styles/ImageInput.css'
import UploadPlaceholder from '../common/UploadPlaceholder'
import UploadTargetFieldset from '../../utils/UploadTargetFieldset'
import WithMaterializedReference from '../../utils/WithMaterializedReference'

const SUPPORT_DIRECT_UPLOADS = get(formBuilderConfig, 'images.directUploads')

type FieldT = {
  name: string
  type: Type
}

export type AssetDocumentProps = {
  originalFilename?: string
  label?: string
  title?: string
  description?: string
  creditLine?: string
  source?: {
    id: string
    name: string
    url?: string
  }
}

export type AssetFromSource = {
  kind: 'assetDocumentId' | 'file' | 'base64' | 'url'
  value: string | File
  assetDocumentProps?: AssetDocumentProps
}

export interface Value {
  _upload?: any
  asset?: Reference
  hotspot?: any
  crop?: any
}

export type Props = {
  value?: Value
  document?: Value
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
  presence: any
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
  selectedAssetSource?: any
  hasFocus: boolean
}
const globalAssetSources = userDefinedAssetSources ? userDefinedAssetSources : assetSources

export default class ImageInput extends React.PureComponent<Props, ImageInputState> {
  static contextTypes = {
    getValuePath: PropTypes.func
  }

  _focusArea: any
  uploadSubscription: any
  state = {
    isUploading: false,
    uploadError: null,
    isAdvancedEditOpen: false,
    selectedAssetSource: null,
    hasFocus: false
  }
  assetSources = globalAssetSources

  constructor(props: Props) {
    super(props)
    // Allow overriding sources set directly on type.options
    const sourcesFromType = get(props.type, 'options.sources')
    if (Array.isArray(sourcesFromType) && sourcesFromType.length > 0) {
      this.assetSources = sourcesFromType
    } else if (sourcesFromType) {
      this.assetSources = null
    }
  }

  focus() {
    if (this._focusArea) {
      this._focusArea.focus()
    }
  }

  setFocusArea = (el: any | null) => {
    this._focusArea = el
  }

  isImageToolEnabled() {
    return get(this.props.type, 'options.hotspot') === true
  }

  getConstrainedImageSrc = (assetDocument: Record<string, any>): string => {
    const materializedSize = ImageTool.maxWidth || 1000
    const maxSize = materializedSize * getDevicePixelRatio()
    const constrainedSrc = `${assetDocument.url}?w=${maxSize}&h=${maxSize}&fit=max`
    return constrainedSrc
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

  getUploadOptions = (file: File): Array<ResolvedUploader> => {
    const {type, resolveUploader} = this.props
    const uploader = resolveUploader && resolveUploader(type, file)
    return uploader ? [{type: type, uploader}] : []
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

  uploadWith(uploader: Uploader, file: File, assetDocumentProps: AssetDocumentProps = {}) {
    const {type, onChange} = this.props
    const {label, title, description, creditLine, source} = assetDocumentProps
    const options = {
      metadata: get(type, 'options.metadata'),
      storeOriginalFilename: get(type, 'options.storeOriginalFilename'),
      label,
      title,
      description,
      creditLine,
      source
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

  handleRemoveButtonClick = (event: React.SyntheticEvent<any>) => {
    const {getValuePath} = this.context
    const {value} = this.props
    const parentPathSegment = getValuePath().slice(-1)[0]

    // String path segment mean an object path, while a number or a
    // keyed segment means we're a direct child of an array
    const isArrayElement = typeof parentPathSegment !== 'string'

    // When removing the image, we should also remove any crop and hotspot
    // _type and _key are "meta"-properties and are not significant unless
    // other properties are present. Thus, we want to remove the entire
    // "container" object if these are the only properties present, BUT
    // only if we're not an array element, as removing the array element
    // will close the selection dialog. Instead, when closing the dialog,
    // the array logic will check for an "empty" value and remove it for us
    const allKeys = Object.keys(value)
    const remainingKeys = allKeys.filter(
      key => !['_type', '_key', '_upload', 'asset', 'crop', 'hotspot'].includes(key)
    )

    const isEmpty = remainingKeys.length === 0
    const removeKeys = ['asset']
      .concat(allKeys.filter(key => ['crop', 'hotspot', '_upload'].includes(key)))
      .map(key => unset([key]))

    this.props.onChange(PatchEvent.from(isEmpty && !isArrayElement ? unset() : removeKeys))
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
  handleSelectAssetFromSource = (assetFromSource: AssetFromSource) => {
    const {onChange, type, resolveUploader} = this.props
    if (!assetFromSource) {
      throw new Error('No asset given')
    }
    if (!Array.isArray(assetFromSource) || assetFromSource.length === 0) {
      throw new Error('Returned value must be an array with at least one item (asset)')
    }
    const firstAsset = assetFromSource[0]
    const originalFilename = get(firstAsset, 'assetDocumentProps.originalFilename')
    const label = get(firstAsset, 'assetDocumentProps.label')
    const title = get(firstAsset, 'assetDocumentProps.title')
    const description = get(firstAsset, 'assetDocumentProps.description')
    const creditLine = get(firstAsset, 'assetDocumentProps.creditLine')
    const source = get(firstAsset, 'assetDocumentProps.source')
    switch (firstAsset.kind) {
      case 'assetDocumentId':
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
                _ref: firstAsset.value
              },
              ['asset']
            )
          ])
        )
        break
      case 'file':
        const uploader = resolveUploader(type, firstAsset.value)
        this.uploadWith(uploader, firstAsset.value, {label, title, description, creditLine, source})
        break
      case 'base64':
        base64ToFile(firstAsset.value, originalFilename).then(file => {
          const uploader = resolveUploader(type, file)
          this.uploadWith(uploader, file, {label, title, description, creditLine, source})
        })
        break
      case 'url':
        urlToFile(firstAsset.value, originalFilename).then(file => {
          const uploader = resolveUploader(type, file)
          this.uploadWith(uploader, file, {label, title, description, creditLine, source})
        })
        break
      default: {
        throw new Error('Invalid value returned from asset source plugin')
      }
    }
    this.setState({selectedAssetSource: null})
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

  handleCancelUpload = () => {
    this.cancelUpload()
  }

  handleSelectFile = (files: FileList) => {
    this.uploadFirstAccepted(files)
  }

  handleUpload = ({file, uploader}) => {
    this.uploadWith(uploader, file)
  }

  handleSelectImageFromAssetSource = source => {
    this.setState({selectedAssetSource: source})
  }

  handleAssetSourceClosed = () => {
    this.setState({selectedAssetSource: null})
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

  renderFields(fields: Array<FieldT>) {
    return fields.map(field => this.renderField(field))
  }

  renderField(field: FieldT) {
    const {value, level, focusPath, onFocus, readOnly, onBlur, presence} = this.props
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
          presence={presence}
        />
      </div>
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

  renderDropDownMenuItem = item => {
    if (!item) {
      return null
    }
    const Icon = item.icon || ImageIcon
    return (
      <div className={styles.selectDropDownAssetSourceItem}>
        <div className={styles.selectDropDownAssetSourceIcon}>
          <Icon />
        </div>
        <div>{item.title}</div>
      </div>
    )
  }

  renderSelectImageButton() {
    // If there are multiple asset sources render a dropdown
    if (this.assetSources.length > 1) {
      return (
        <DropDownButton
          items={this.assetSources}
          renderItem={this.renderDropDownMenuItem}
          onAction={this.handleSelectImageFromAssetSource}
          kind="default"
          inverted
          showArrow
          ripple={false}
        >
          Select from
        </DropDownButton>
      )
    }
    // Single asset source (just a normal button)
    return (
      <Button
        onClick={this.handleSelectImageFromAssetSource.bind(this, this.assetSources[0])}
        inverted
      >
        Select
      </Button>
    )
  }

  renderAssetSource() {
    const {selectedAssetSource} = this.state
    const {value, materialize, document} = this.props
    if (!selectedAssetSource) {
      return null
    }
    const Component = selectedAssetSource.component
    if (value && value.asset) {
      return (
        <WithMaterializedReference materialize={materialize} reference={value.asset}>
          {imageAsset => {
            return (
              <Component
                document={document}
                selectedAssets={[imageAsset]}
                selectionType="single"
                onClose={this.handleAssetSourceClosed}
                onSelect={this.handleSelectAssetFromSource}
              />
            )
          }}
        </WithMaterializedReference>
      )
    }
    return (
      <Component
        document={document}
        selectedAssets={[]}
        selectionType="single"
        onClose={this.handleAssetSourceClosed}
        onSelect={this.handleSelectAssetFromSource}
      />
    )
  }

  render() {
    const {type, value, level, materialize, markers, readOnly, presence} = this.props
    const {isAdvancedEditOpen, selectedAssetSource, uploadError, hasFocus} = this.state
    const [highlightedFields, otherFields] = partition(
      type.fields.filter(field => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )
    const accept = get(type, 'options.accept', 'image/*')
    const hasAsset = value && value.asset
    const showAdvancedEditButton =
      value && (otherFields.length > 0 || (hasAsset && this.isImageToolEnabled()))
    const FieldSetComponent = SUPPORT_DIRECT_UPLOADS ? UploadTargetFieldset : Fieldset
    const uploadProps = SUPPORT_DIRECT_UPLOADS
      ? {getUploadOptions: this.getUploadOptions, onUpload: this.handleUpload}
      : {}

    const isInside = presence
      .map(item => {
        const otherFieldsPath = otherFields.map(field => field.name)
        return item.path.some(path => otherFieldsPath.includes(path)) ? item.identity : null
      })
      .filter(String)
    return (
      <FieldSetComponent
        markers={markers}
        presence={presence.filter(item => item.path[0] === '$' || isInside.includes(item.identity))}
        legend={type.title}
        description={type.description}
        level={level}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        ref={this.setFocusArea}
        {...uploadProps}
      >
        <div>
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
                SUPPORT_DIRECT_UPLOADS && <UploadPlaceholder hasFocus={hasFocus} />
              )}
            </div>
          </div>
          <div className={styles.functions}>
            <ButtonGrid>
              {!readOnly && SUPPORT_DIRECT_UPLOADS && (
                <FileInputButton
                  icon={UploadIcon}
                  inverted
                  onSelect={this.handleSelectFile}
                  accept={accept}
                >
                  Upload
                </FileInputButton>
              )}
              {!readOnly && this.renderSelectImageButton()}
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
        </div>
        {highlightedFields.length > 0 && this.renderFields(highlightedFields)}
        {isAdvancedEditOpen && this.renderAdvancedEdit(otherFields)}
        {selectedAssetSource && this.renderAssetSource()}
      </FieldSetComponent>
    )
  }
}
