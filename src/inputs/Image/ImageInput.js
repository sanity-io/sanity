import React, {PropTypes} from 'react'
import ImageSelect from './common/ImageSelect'
import {omit, uniqueId, groupBy} from 'lodash'
import RenderField from '../Object/RenderField'
import ObjectValueContainer from '../Object/ObjectContainer'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import buttonStyles from 'part:@sanity/components/buttons/default-style'
import ImageTool from '@sanity/imagetool'
import _HotspotImage from '@sanity/imagetool/HotspotImage'
import createImageLoader from './common/createImageLoader'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '@sanity/imagetool/constants'
import styles from './styles/ImageInput.css'
import UploadIcon from 'part:@sanity/base/upload-icon'

const HotspotImage = createImageLoader(_HotspotImage, image => {
  return {srcAspectRatio: image.width / image.height}
})

const ASPECT_RATIOS = [
  ['Landscape', 16 / 9],
  ['Portrait', 9 / 16],
  ['Square', 1],
  ['Panorama', 4]
]

export default class ImageInput extends React.PureComponent {
  static propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    uploadFn: PropTypes.func.isRequired,
    materializeReferenceFn: PropTypes.func.isRequired,
    level: PropTypes.number,
    validation: PropTypes.object
  }
  static valueContainer = ObjectValueContainer

  state = {
    status: 'ready',
    error: null,
    progress: null,
    uploadingImage: null,
    materializedImage: null,
    isAdvancedEditOpen: false
  }

  subscription = null

  componentDidMount() {
    const {value} = this.props
    const imageReference = value.getFieldValue('asset')
    this.materializeImageRef(imageReference)
  }

  componentWillReceiveProps(nextProps) {
    const nextRef = nextProps.value.getFieldValue('asset')
    if (this.props.value.getFieldValue('asset') !== nextRef) {
      this.cancel()
      this.materializeImageRef(nextRef)
    }
  }

  upload(image) {
    this.cancel()
    this.setState({uploadingImage: image})

    this.subscription = this.props.uploadFn(image).subscribe({
      next: this.handleUploadProgress,
      error: this.handleUploadError,
      complete: this.handleUploadComplete,
    })
  }

  materializeImageRef(ref) {
    if (ref.isEmpty()) {
      this.setState({materializedImage: null})
      return
    }
    const {materializeReferenceFn} = this.props
    materializeReferenceFn(ref.refId).then(materialized => {
      this.setState({materializedImage: materialized})
    })
  }

  componentWillUnmount() {
    this.cancel()
  }

  cancel() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  handleUploadProgress = event => {
    if (event.type === 'progress') {
      this.setState({
        status: 'pending',
        progress: {percent: event.percent}
      })
    }
  }

  handleUploadError = error => {
    this.setState({
      status: 'error',
      error: error
    })
  }

  handleUploadComplete = reference => {
    this.setState({
      status: 'complete',
    })
    const {onChange} = this.props
    const patch = {asset: {$set: reference}}
    onChange({patch})
  }

  handleSelect = images => {
    this.upload(images[0])
  }

  handleCancel = () => {
    this.cancel()
    this.setState({
      status: 'cancelled',
      error: null,
      progress: null,
      uploadingImage: null
    })
  }

  handleFieldChange = (event, fieldName) => {
    const {onChange} = this.props
    const patch = {[fieldName]: event.patch}
    onChange({patch})
  }

  handleFieldEnter = (event, fieldName) => {
    this.props.onEnter(fieldName)
  }

  handleEditBtnClick = event => {
    this.setState({isAdvancedEditOpen: true})
  }

  handleEditDialogClose = event => {
    this.setState({isAdvancedEditOpen: false})
  }

  renderFields(fields) {
    return fields.map(field => this.renderField(field))
  }

  handleImageToolChange = newValue => {
    this.props.onChange({
      patch: {
        crop: {$set: newValue.crop},
        hotspot: {$set: newValue.hotspot}
      }
    })
  }

  renderImageTool() {
    const {value} = this.props
    const hotspot = value.getFieldValue('hotspot').toJSON() || DEFAULT_HOTSPOT
    const crop = value.getFieldValue('crop').toJSON() || DEFAULT_CROP

    const {uploadingImage, materializedImage} = this.state

    const imageUrl = uploadingImage ? uploadingImage.previewUrl : (materializedImage || {}).url
    return (
      <div>
        <div style={{display: 'flex'}}>
          <div style={{width: '40%'}}>
            <ImageTool value={{hotspot, crop}} src={imageUrl} onChange={this.handleImageToolChange} />
          </div>
          <div>
            {ASPECT_RATIOS.map(([title, ratio]) => {
              return (
                <div key={ratio}>
                  <h2>{title}</h2>
                  <HotspotImage hotspot={hotspot} crop={crop} src={imageUrl} aspectRatio={ratio} />
                </div>
              )
            })}
          </div>
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
      <Dialog title="Edit details" onClose={this.handleEditDialogClose}>
        {grouped.imagetool && this.renderImageTool()}
        {grouped.other && this.renderFields(grouped.other)}
        <Button onClick={this.handleEditDialogClose}>Close</Button>
      </Dialog>
    )
  }

  renderField(field) {
    const {value, validation, level} = this.props
    const fieldValidation = validation && validation.fields[field.name]

    const fieldValue = value.getFieldValue(field.name)

    return (
      <RenderField
        key={field.name}
        fieldName={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        onEnter={this.handleFieldEnter}
        validation={fieldValidation}
        level={level + 1}
      />
    )
  }

  render() {
    const {status, progress, uploadingImage, materializedImage, isAdvancedEditOpen} = this.state
    const {field, level, value, fieldName, ...rest} = omit(this.props,
      'uploadFn',
      'materializeReferenceFn',
      'onChange',
      'onEnter',
      'validation',
      'focus'
    )
    const inputId = uniqueId('FormBuilderImage')

    const fieldGroups = groupBy(field.fields, fieldDef => {
      if (fieldDef.name === 'asset') {
        return 'asset'
      }
      if (fieldDef.options && fieldDef.options.isHighlighted) {
        return 'highlighted'
      }
      return 'other'
    })

    // if (!uploadingImage && value.isEmpty()) {
    //   return (
    //     <ImageSelect
    //       name={fieldName}
    //       onSelect={this.handleSelect}
    //       {...rest}
    //     >
    //       Upload image…
    //     </ImageSelect>
    //   )
    // }

    const imageUrl = uploadingImage ? uploadingImage.previewUrl : (materializedImage || {}).url

    const hotspot = value.getFieldValue('hotspot').toJSON() || DEFAULT_HOTSPOT
    const crop = value.getFieldValue('crop').toJSON() || DEFAULT_CROP

    return (
      <Fieldset legend={field.title} level={level}>
        <div className={styles.grid}>
          <div className={imageUrl ? styles.imageWrapper : styles.imageWrapperEmpty}>
            {
              //<img src={imageUrl} width="150" className={styles.imageUploading} />
            }

            {
              imageUrl
              && <div className={uploadingImage ? styles.imageUploading : styles.imageUploaded}>
                <HotspotImage
                  aspectRatio="auto"
                  hotspot={hotspot}
                  crop={crop}
                  src={imageUrl}
                />
              </div>
            }

            {
              !imageUrl
              && <ImageSelect
                className={styles.upload}
                name={fieldName}
                onSelect={this.handleSelect}
                {...rest}
              >
                <div className={styles.uploadInner}>
                  <UploadIcon className={styles.uploadIcon} />
                  Upload image
                </div>
              </ImageSelect>
            }
            {
              uploadingImage && status !== 'complete'
              && <div className={styles.progressContainer}>
                <div className={styles.progressInner}>
                  {progress && <ProgressCircle completion={progress.percent} showPercent className={styles.progress} />}
                </div>
              </div>
            }
            {
              //status === 'pending' && <Button onClick={this.handleCancel}>Cancel upload</Button>
            }
            {
              //status === 'complete' && <div>Uploaded</div>
            }
          </div>
          <div className={styles.fields}>
            {this.renderFields(fieldGroups.highlighted || [])}
            <ImageSelect
              className={buttonStyles.root}
              name={fieldName}
              onSelect={this.handleSelect}
              {...rest}
            >
              Upload new
            </ImageSelect>
            {fieldGroups.other && <Button onClick={this.handleEditBtnClick}>Edit image</Button>}
          </div>
        </div>
        {isAdvancedEditOpen && this.renderAdvancedEdit(fieldGroups.highlighted.concat(fieldGroups.other))}
      </Fieldset>
    )
  }
}
