import React from 'react'
import HotspotImage from '../../../HotspotImage'
import ImageUploader from '../../../inputs/uploader/ImageUploader'
import CropTool from './CropTool'
import ProgressTracker from '../../../inputs/uploader/ProgressTracker'
import MetaFields from './MetaFields'
import FieldErrors from '../../FieldErrors'
import Button from '../../../Button'
import _t from '../../../../lib/translate'._t
import Dispatchable from '../../../../lib/mixins/Dispatchable'
import FormBuilderField from '../../FormBuilderFieldMixin'
import isSameDocument from '../../../../lib/utils/isSameDocument'

function isValue(val) {
  return function validate(props, propName, componentName) {
    const givenVal = props[propName]
    if (givenVal !== val) {
      return new Error(`Invalid value ${givenVal} for property ${propName} in ${componentName}. Must be ${val}`)
    }
  }
}

export default React.createClass({
  displayName: 'EditImage',
  mixins: [Dispatchable, FormBuilderField],
  propTypes: {
    field: React.PropTypes.object,
    onChange: React.PropTypes.func,
    onCancel: React.PropTypes.func,
    onLock: React.PropTypes.func,
    onRelease: React.PropTypes.func,
    value: React.PropTypes.shape({
      type: isValue('reference'),
      to: isValue('image'),
      id: React.PropTypes.any,
      crop: React.PropTypes.any,
      hotspot: React.PropTypes.any,
      meta: React.PropTypes.any
    })
  },

  actions: {
    DOCUMENT_READY({document}) {
      if (!this.props.value) {
        return
      }
      if (this.props.value.id === document.id) {
        this.setState({imageDocument: document})
      }
    },
    DOCUMENT_NOT_FOUND({document}) {
      //console.log("Document not found", document);
    },
    DOCUMENT_SAVED({document}) {
      const {newImageDocument} = this.state
      if (isSameDocument(newImageDocument, document)) {
        this._setValue(this.mergeValue(this.createReferenceFromImageDocument(document)))
      }
    },
    UPLOAD_PROGRESSED({id, progress}) {
      if (!this.state.progress || id !== this.state.progress.id) {
        return
      }

      this.setState({
        progress: Object.assign({}, this.state.progress, progress)
      })

      if (progress.status === 'completed') {
        this.saveImageReference(progress.metadata)
        this.releaseLock()
      }
    },
    UPLOAD_FAILED({id, file, error}) {
      if (!this.state.progress || id !== this.state.progress.id) {
        return
      }

      this.setState({
        progress: Object.assign(this.state.progress, {error, percent: 0})
      })
      this.releaseLock()
    }
  },

  componentDidMount() {
    if (this.props.value && this.props.value.id) {
      this.appDispatcher.requestDocument(this.props.value.id)
    }
  },

  componentDidUpdate(prevProps) {
    if (this.props.value && this.props.value.id &&
      (prevProps.value && prevProps.value.id) !== this.props.value.id) {
      this.appDispatcher.requestDocument(this.props.value.id)
    }
  },

  saveImageReference(metadata) {
    const doc = Object.assign({
      type: 'image',
      _tempId: Math.random().toString(32).substring(2) // todo: fix this
    }, metadata)

    this.setState({newImageDocument: doc})
    this.appDispatcher.saveDocument(doc)
  },

  getInitialState() {
    return {
      imageToolEditValue: null,
      newImageDocument: null,
      imageDocument: null,
      progress: null,
      //imageMetaDataErrors: [],
      isCropToolOpen: false
    }
  },

  upload(progress) {
    this.setState({
      progress: progress
    })

    this.appDispatcher.uploadImage({
      id: progress.id,
      file: progress.file
    })
    this.lock()
  },

  handleSelectFiles(progressItems) {
    this.upload(progressItems[0])
  },

  handleCancelUpload() {
    this.setState({progress: null})
    this.releaseLock()
  },

  handleRetryUpload(progress) {
    // Todo: fix this hack
    const newProgress = Object.assign({}, progress, {error: null})
    this.upload(newProgress)
  },

  handleClear() {
    this._setValue(null)
    this.setState({progress: null})
    this.releaseLock()
  },

  releaseLock() {
    const {onRelease} = this.props
    if (onRelease) {
      onRelease()
    }
  },

  lock() {
    const {onLock} = this.props
    if (onLock) {
      onLock(_t('formBuilder.fields.image.uploading'))
    }
  },

  openCropTool() {
    const value = this._getValue() || {}
    this.setState({
      imageToolEditValue: {
        crop: value.crop,
        hotspot: value.hotspot
      }
    })
  },

  closeCropTool() {
    this.setState({
      imageToolEditValue: null
    })
  },

  handleCropToolCancel() {
    this.closeCropTool()
  },

  handleCropToolChange(newValue) {
    this.setState({
      imageToolEditValue: newValue
    })
  },

  handleCropToolSubmit(newValue) {
    this._setValue(this.mergeValue({
      hotspot: newValue.hotspot,
      crop: newValue.crop
    }))
    this.closeCropTool()
  },

  mergeValue(changes) {
    return Object.assign({}, this._getValue() || {}, changes)
  },

  createReferenceFromImageDocument(imageDoc) {
    return Object.assign({
      type: 'reference',
      to: 'image',
      id: imageDoc.id
    })
  },

  getImageUrlFromDocument(doc) {
    if (doc) {
      const optimal = doc.versions.find(version => !version.square && version.width > 300)
      return optimal ? optimal.url : (doc.fullsize || doc.original)
    }
  },

  handleMetaDataChange(newMetaData) {
    this._setValue(this.mergeValue({meta: newMetaData}))
  },

  renderMetaFields() {
    const {field, document, value, schema, fieldBuilders, fieldPreviews, errors} = this.props

    if (!field.meta) {
      return null
    }

    const metaValue = value ? value.meta : {}
    return (
      <MetaFields
        value={metaValue}
        schema={schema}
        field={field}
        validation={errors && errors.length > 0 && errors[0].nested} // todo: needs a rethink
        ref='metaDataField'
        document={document}
        fields={schema[field.meta].attributes}
        fieldBuilders={fieldBuilders}
        fieldPreviews={fieldPreviews}
        onChange={this.handleMetaDataChange}
        />
    )
  },

  renderProgressBar() {
    const {progress} = this.state
    if (!progress) {
      return null
    }
    return (
      <ProgressTracker progress={progress} onCancel={this.handleCancelUpload} onRetry={this.handleRetryUpload}/>
    )
  },

  render() {
    const {imageToolEditValue, progress, imageDocument} = this.state
    const {field, errors} = this.props

    const imageUrl = progress ? progress.previewUrl : this.getImageUrlFromDocument(imageDocument)

    const value = this._getValue()
    if (!value && !progress) {
      return <ImageUploader onSelectFiles={this.handleSelectFiles}/>
    }

    return (
      <div className="image-field">
        {this.renderProgressBar()}
        {!imageToolEditValue && (
          <div>
            <div className="form-group">
              <div className="image-field__image-container">
                <HotspotImage
                  aspectRatio={16 / 8}
                  crop={value && value.crop}
                  hotspot={value && value.hotspot}
                  imageUrl={imageUrl}/>
              </div>
            </div>
            <div className="image-field__meta-field form-group">
              {!field.disableImageTool && (
                <Button
                  type="button"
                  className="positive"
                  onClick={this.openCropTool}>
                  {_t('formBuilder.fields.image.changeHotspotAndCrop')}
                </Button>
              )}
              <ImageUploader onSelectFiles={this.handleSelectFiles}/>
              <Button
                type="button"
                className="negative remove-image"
                onClick={this.handleClear}>
                {_t('formBuilder.fields.image.removeImage')}
              </Button>
            </div>
          </div>
        )}

        {this.renderMetaFields()}
        <FieldErrors errors={errors}/>

        {imageToolEditValue && (
          <CropTool
            imageUrl={imageUrl}
            onChange={this.handleCropToolChange}
            onCancel={this.handleCropToolCancel}
            onSubmit={this.handleCropToolSubmit}
            value={imageToolEditValue}
            />
        )}
      </div>
    )
  }
})
