import PropTypes from 'prop-types'
import React from 'react'
import {omit, groupBy, get} from 'lodash'

import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import DefaultImageInput from 'part:@sanity/components/imageinput/default'
import ImageLoader from 'part:@sanity/components/utilities/image-loader'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import imageUrlBuilder from '@sanity/image-url'
import Field from '../Object/Field'
import ImageTool from '@sanity/imagetool'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import {DEFAULT_CROP} from '@sanity/imagetool/constants'
import subscriptionManager from '../../utils/subscriptionManager'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import SelectAsset from './SelectAsset'
import client from 'part:@sanity/base/client'
import styles from './ImageInput.css'

let imageBuilder
const getImageBuilder = () => {
  if (!imageBuilder) {
    imageBuilder = imageUrlBuilder(client.config())
  }

  return imageBuilder
}

const DEFAULT_HOTSPOT = {
  height: 1,
  width: 1,
  x: 0.5,
  y: 0.5
}

const ASPECT_RATIOS = [
  ['Landscape', 16 / 9],
  ['Portrait', 9 / 16],
  ['Square', 1],
  ['Panorama', 4]
]

function getInitialState() {
  return {
    status: 'ready',
    error: null,
    value: null,
    progress: null,
    uploadingImage: null,
    materializedImage: null,
    isAdvancedEditOpen: false,
    isSelectAssetOpen: false
  }
}

export default class ImageInput extends React.PureComponent<*> {
  _unmounted: boolean

  static propTypes = {
    type: PropTypes.shape({
      name: PropTypes.string.isRequired,
      fields: PropTypes.array
    }),
    value: PropTypes.object,
    onChange: PropTypes.func,
    uploadFn: PropTypes.func.isRequired,
    materializeReferenceFn: PropTypes.func.isRequired,
    level: PropTypes.number
  }

  state = getInitialState()

  subscriptions = subscriptionManager('upload', 'materialize')

  componentDidMount() {
    const {value} = this.props
    if (value) {
      this.syncImageRef(value.asset)
    }
  }

  componentWillReceiveProps(nextProps) {
    const currentRef = get(this.props, 'value.asset')
    const nextRef = get(nextProps, 'value.asset')

    const shouldUpdate = currentRef !== nextRef || get(currentRef, '_ref') !== get(nextRef, '_ref')

    if (shouldUpdate) {
      this.setState(omit(getInitialState(), 'materializedImage', 'uploadingImage'))
      this.cancelUpload()
      this.syncImageRef(nextRef)
    }
  }

  upload(image) {
    this.cancelUpload()
    this.setState({uploadingImage: image})

    this.subscriptions.replace('upload', this.props.uploadFn(image.file).subscribe({
      next: this.handleUploadProgress,
      error: this.handleUploadError
    }))
  }

  syncImageRef(reference) {
    if (!reference) {
      this.setState({materializedImage: null})
      return
    }
    const {materializeReferenceFn} = this.props
    this.subscriptions.replace('materialize', materializeReferenceFn(reference._ref).subscribe(materialized => {
      this.setState({materializedImage: materialized})
    }))
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe('materialize')
    // todo: fix this properly by unsubscribing to upload observable without cancelling it
    this._unmounted = true
  }

  cancelUpload() {
    this.subscriptions.unsubscribe('upload')
  }

  hasField(fieldName) {
    return this.props.type.fields.find(field => field.name === fieldName)
  }

  setStateIfMounted(...args) {
    if (!this._unmounted) {
      this.setState(...args)
    }
  }

  handleUploadProgress = event => {
    if (event.type === 'progress' && event.stage === 'upload') {
      this.setStateIfMounted({
        status: 'pending',
        progress: {percent: event.percent}
      })
    }

    if (event.type === 'complete') {
      const {onChange, type} = this.props
      this.setStateIfMounted({
        uploadingImage: null,
        status: 'complete',
        materializedImage: event.asset
      }, () => {
        // Important: needs to be emitted after the state is updated
        // or else materializing on the next componentWillReceiveProps may not
        // be able to compare with current materialized image
        onChange(PatchEvent.from(
          setIfMissing({
            _type: type.name,
            asset: {_type: 'reference'}
          }),
          set({_type: 'reference', _ref: event.id}, ['asset'])
        ))
      })
    }
  }

  handleUploadError = error => {
    this.setState({
      status: 'error'
    })
  }

  handleSelect = images => {
    this.upload(images[0])
  }

  handleClearValue = event => {
    event.preventDefault()
    const {onChange} = this.props
    onChange(PatchEvent.from(unset()))
    this.setState({status: 'ready'})
  }

  handleCancel = () => {
    this.cancelUpload()
    this.setState({
      status: 'ready',
      progress: null,
      uploadingImage: null
    })
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

  handleEditDialogClose = event => {
    this.setState({isAdvancedEditOpen: false})
  }

  renderFields(fields) {
    return fields.map(field => this.renderField(field))
  }

  handleImageToolChange = newValue => {
    this.setState({
      value: newValue
    })
  }

  handleImageToolComplete = newValue => {
    const {onChange, type} = this.props
    onChange(
      PatchEvent.from(
        setIfMissing({
          _type: type.name,
          asset: {_type: 'reference'}
        }),
        set(newValue.crop, ['crop']),
        set(newValue.hotspot, ['hotspot'])
      )
    )
  }

  getImageUrl() {
    const {uploadingImage, materializedImage} = this.state
    if (uploadingImage) {
      return uploadingImage.previewUrl
    }
    if (materializedImage && materializedImage.url) {
      return `${materializedImage.url}`
    }
    return null
  }

  isImageToolEnabled() {
    return this.hasField('hotspot') && this.hasField('crop')
  }

  renderImageTool() {
    const {value} = this.props

    const hotspot = (this.state.value && this.state.value.hotspot) || (value && value.hotspot) || DEFAULT_HOTSPOT
    const crop = (this.state.value && this.state.value.crop) || (value && value.crop) || DEFAULT_CROP

    const {uploadingImage} = this.state

    const imageUrl
      = uploadingImage
        ? uploadingImage.previewUrl
        : getImageBuilder()
          .image(value)
          .width(800)
          .ignoreImageParams()
          .url()
    return (
      <div className={styles.imageTool}>
        <div className={styles.mainImage}>
          <ImageTool
            value={{hotspot, crop}}
            src={imageUrl}
            onChange={this.handleImageToolChange}
            onComplete={this.handleImageToolComplete}
          />
        </div>
        <div className={styles.previews}>
          {ASPECT_RATIOS.map(([title, ratio]) => {
            return (
              <div key={ratio} style={{flexGrow: 1}}>
                <h4>{title}</h4>
                <ImageLoader src={imageUrl}>
                  {({image, error}) => {
                    return (
                      <div style={{margin: 4, border: '1px dashed #999', backgroundColor: '#eee'}}>
                        <HotspotImage
                          aspectRatio={ratio}
                          src={image.src}
                          srcAspectRatio={image.width / image.height}
                          hotspot={hotspot}
                          crop={crop}
                        />
                      </div>
                    )
                  }}
                </ImageLoader>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  renderAdvancedEdit(fields) {
    const grouped = groupBy(fields, field => {
      if (field.name === 'hotspot' || field.name === 'crop') {
        return 'imagetool'
      }
      return 'other'
    })
    return (
      <Dialog title="Edit details" onClose={this.handleEditDialogClose} isOpen>
        {grouped.imagetool && (
          <div>
            <h2>Hotspot/crop</h2>
            <div>
              {grouped.imagetool && this.renderImageTool()}
            </div>
          </div>
        )}
        <div>
          {grouped.other && this.renderFields(grouped.other)}
        </div>
      </Dialog>
    )
  }

  renderField(field) {
    const {value, level} = this.props
    const fieldValue = value && value[field.name]

    return (
      <Field
        key={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        level={level + 1}
      />
    )
  }

  handleOpenAdvancedEdit = () => {
    this.setState({
      isAdvancedEditOpen: true
    })
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

  handleSelectAsset = asset => {
    const {onChange, type} = this.props
    onChange(PatchEvent.from([
      setIfMissing({
        _type: type.name
      }),
      set({
        _type: 'reference',
        _ref: asset._id
      }, ['asset'])
    ]))

    this.setState({
      isSelectAssetOpen: false
    })
  }

  render() {
    const {status, progress, isAdvancedEditOpen, isSelectAssetOpen} = this.state
    const {
      type,
      level,
      value
    } = this.props

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

    const imageUrl = this.getImageUrl()

    const isImageToolEnabled = this.isImageToolEnabled()

    const accept = get(type, 'options.accept')

    const hasAdvancedFields = fieldGroups.other.length > 0
    const onEdit = hasAdvancedFields ? this.handleOpenAdvancedEdit : null
    return (
      <Fieldset legend={type.title} description={type.description} level={level}>
        <DefaultImageInput
          status={status}
          legend={type.title}
          level={level}
          percent={progress && progress.percent}
          onSelect={this.handleSelect}
          onCancel={this.handleCancel}
          onClear={this.handleClearValue}
          onEdit={onEdit}
          showContent={fieldGroups.highlighted.length > 0}
          multiple={false}
          accept={accept || 'image/*'}
          hotspotImage={{
            hotspot: isImageToolEnabled ? (value && value.hotspot) : DEFAULT_HOTSPOT,
            crop: isImageToolEnabled ? (value && value.crop) : DEFAULT_CROP,
            imageUrl: imageUrl
          }}
        >
          {fieldGroups.highlighted.length > 0 && this.renderFields(fieldGroups.highlighted)}
          {isSelectAssetOpen && (
            <Dialog title="Select image" onClose={this.handleCloseSelectAsset} isOpen>
              <SelectAsset onSelect={this.handleSelectAsset} />
            </Dialog>
          )}
          {isAdvancedEditOpen && this.renderAdvancedEdit(fieldGroups.highlighted.concat(fieldGroups.other))}
        </DefaultImageInput>
        <Button onClick={this.handleOpenSelectAsset}>Select from library…</Button>
      </Fieldset>
    )
  }
}
