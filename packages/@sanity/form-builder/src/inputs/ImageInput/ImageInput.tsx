/* eslint-disable complexity */

import React from 'react'
import {get, partition} from 'lodash'
import {Observable} from 'rxjs'
import ImageTool from '@sanity/imagetool'

import ImageIcon from 'react-icons/lib/md/image'
import Button from 'part:@sanity/components/buttons/default'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import EditIcon from 'part:@sanity/base/edit-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
// TODO: investigate why 'all:part' doesn't work with TS, when just 'part:' works.
// @ts-ignore
import assetSources from 'all:part:@sanity/form-builder/input/asset-source'
import userDefinedAssetSources from 'part:@sanity/form-builder/input/asset-sources?'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import styles from './styles/ImageInput.css'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import {Marker, Reference, Type} from '../../typedefs'
import WithMaterializedReference from '../../utils/WithMaterializedReference'
import ImageToolInput from '../ImageToolInput'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import {FormBuilderInput} from '../../FormBuilderInput'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {Path} from '../../typedefs/path'

type FieldT = {
  name: string
  type: Type
}

type AssetFromSource = {
  kind: 'assetDocumentId' | 'binary'
  value: string
}

export interface Value {
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
  selectedAssetSource?: any
}
const globalAssetSources = userDefinedAssetSources ? userDefinedAssetSources : assetSources

export default class ImageInput extends React.PureComponent<Props, ImageInputState> {
  _focusArea: any
  uploadSubscription: any
  state = {
    isUploading: false,
    uploadError: null,
    isAdvancedEditOpen: false,
    selectedAssetSource: null
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

  handleRemoveButtonClick = (event: React.SyntheticEvent<any>) => {
    this.props.onChange(PatchEvent.from(unset(['asset'])))
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
    if (!assetFromSource) {
      throw new Error('No asset given')
    }
    switch (assetFromSource.kind) {
      case 'assetDocumentId':
        this.handleSelectAsset({_id: assetFromSource.value})
        break
      case 'binary':
        // Upload
        break
      default: {
        throw new Error('Invalid value returned from asset source plugin')
      }
    }
    this.setState({selectedAssetSource: null})
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
  setFocusArea = (el: any | null) => {
    this._focusArea = el
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

  handleSelectImageFromAssetSource = source => {
    this.setState({selectedAssetSource: source})
  }

  handleAssetSourceClosed = () => {
    this.setState({selectedAssetSource: null})
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
          Select
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
    const {value, materialize} = this.props
    if (!selectedAssetSource) {
      return null
    }
    const Component = selectedAssetSource.component
    if (value.asset) {
      return (
        <WithMaterializedReference materialize={materialize} reference={value.asset}>
          {imageAsset => {
            return (
              <Component
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
        selectedAssets={[]}
        selectionType="single"
        onClose={this.handleAssetSourceClosed}
        onSelect={this.handleSelectAssetFromSource}
      />
    )
  }

  render() {
    const {type, value, level, materialize, markers, readOnly} = this.props
    const {isAdvancedEditOpen, selectedAssetSource} = this.state
    const [highlightedFields, otherFields] = partition(
      type.fields.filter(field => !HIDDEN_FIELDS.includes(field.name)),
      'type.options.isHighlighted'
    )
    const hasAsset = value && value.asset
    const showAdvancedEditButton =
      value && (otherFields.length > 0 || (hasAsset && this.isImageToolEnabled()))
    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level}
        tabIndex={0}
        markers={markers}
        onFocus={() => {}}
      >
        <div className={styles.content}>
          <div className={styles.assetWrapper}>
            {hasAsset ? (
              <WithMaterializedReference reference={value.asset} materialize={materialize}>
                {this.renderMaterializedAsset}
              </WithMaterializedReference>
            ) : (
              readOnly && <span>Field is read only</span>
            )}
          </div>
        </div>
        <div className={styles.functions}>
          <ButtonGrid>
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
        {highlightedFields.length > 0 && (
          <div className={styles.fieldsWrapper}>{this.renderFields(highlightedFields)}</div>
        )}
        {isAdvancedEditOpen && this.renderAdvancedEdit(otherFields)}
        {selectedAssetSource && this.renderAssetSource()}
      </Fieldset>
    )
  }
}
