/* eslint-disable complexity */

import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import EditIcon from 'part:@sanity/base/edit-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import {get, partition} from 'lodash'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import styles from './styles/ImageInput.css'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {Marker, Reference, Type} from '../../typedefs'
import {ResolvedUploader, UploaderResolver} from '../../sanity/uploads/typedefs'
import WithMaterializedReference from '../../utils/WithMaterializedReference'
import ImageToolInput from '../ImageToolInput'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import {FormBuilderInput} from '../../FormBuilderInput'
import UploadPlaceholder from '../common/UploadPlaceholder'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import ImageTool from '@sanity/imagetool'
import {Observable} from 'rxjs'
import {Path} from '../../typedefs/path'
import SourceBrowser from './SourceBrowser'

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

  render() {
    const {type, value, level, materialize, markers, readOnly} = this.props
    const {isAdvancedEditOpen, isSelectAssetOpen, hasFocus} = this.state
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
        onFocus={this.handleFocus}
        markers={markers}
      >
        <div className={styles.content}>
          <div className={styles.assetWrapper}>
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
              <Button onClick={this.handleOpenSelectAsset} inverted>
                Select
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
            <SourceBrowser onSelect={this.handleSelectAsset} />
          </Dialog>
        )}
      </Fieldset>
    )
  }
}
