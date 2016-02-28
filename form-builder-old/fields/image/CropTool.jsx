import React from 'react'

import ImageToolWrapper from './ImageToolWrapper'
import Previews from './Previews'
import Modal from '../../../Modal'
import Button from '../../../Button'
import _t from '../../../../lib/translate'._t
import FormBuilderField from '../../FormBuilderFieldMixin'

export default React.createClass({
  displayName: 'CropTool',
  mixins: [FormBuilderField],
  propTypes: {
    onChange: React.PropTypes.func,
    onCancel: React.PropTypes.func,
    onSubmit: React.PropTypes.func,
    value: React.PropTypes.shape({
      crop: React.PropTypes.any,
      hotspot: React.PropTypes.any
    }),
    imageUrl: React.PropTypes.string.isRequired
  },

  mergeValue(changes) {
    return Object.assign({}, this._getValue() || {}, changes)
  },

  handleImageToolChange(newValues) {
    this._setValue(this.mergeValue(newValues))
  },

  handleSubmit(e) {
    if (this.props.onSubmit) {
      this.props.onSubmit(this._getValue())
    }
  },

  handleCancel() {
    if (this.props.onCancel) {
      this.props.onCancel()
    }
  },

  render() {
    const {imageUrl, value} = this.props
    return (
      <Modal visible={true} className="image-field">
        <div className="grid">
          <div className="span1of2">
            <h1>{_t('formBuilder.fields.image.setCropAndHotspot')}</h1>
            <div className="image-tool">
              <ImageToolWrapper
                imageUrl={imageUrl}
                onChange={this.handleImageToolChange}
                value={{crop: value.crop, hotspot: value.hotspot}}/>
            </div>
            <p className="hint">
              {_t('formBuilder.fields.image.setCropAndHotspotHint')}
            </p>
          </div>
          <Previews crop={value.crop} hotspot={value.hotspot} imageUrl={imageUrl}/>
        </div>
        <div className="form-group">
          <Button
            type="button"
            onClick={this.handleSubmit}
            className="positive">
            {_t('common.save')}
          </Button>
          <Button
            type="button"
            className="negative"
            onClick={this.handleCancel}>
            {_t('common.cancel')}
          </Button>
        </div>
      </Modal>
    )
  }
})
