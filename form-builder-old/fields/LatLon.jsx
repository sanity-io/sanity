import React from 'react'
import GoogleMapLoadProxy from '../../GoogleMapLoadProxy'
import GeoPositionSelect from '../../inputs/GeoPositionSelect'
import Button from '../../Button'
import Modal from '../../Modal'
import FormBuilderField from '../FormBuilderFieldMixin'
import FieldErrors from '../FieldErrors'
import _t from '../../../lib/translate'._t

export default React.createClass({
  displayName: 'LatLon',

  mixins: [FormBuilderField],

  propTypes: {
    field: React.PropTypes.shape({
      googleMapsAPIKey: React.PropTypes.string.isRequired,
      googleMapsLocale: React.PropTypes.string,
      googleMapsDefaultLatLon: React.PropTypes.array
    }).isRequired
  },

  getInitialState() {
    return {
      dragMarkerInitialPosition: null,
      modalOpen: false
    }
  },

  handleLocationChange({lat, lon}) {
    if (lat && lon) {
      this._setValue({lat: lat, lon: lon})
    }
  },

  openModal() {
    this.setState({modalOpen: true})
  },

  closeModal() {
    this.setState({modalOpen: false})
  },

  getStaticImageUrl(value) {
    const loc = `${value.lat},${value.lon}` //eslint-disable-line comma-spacing
    return `https://maps.googleapis.com/maps/api/staticmap?center=${loc}&markers=${loc}&zoom=13&size=700x200`
  },

  removeValue() {
    this._setValue(null)
  },

  render() {
    const value = this._getValue()
    return (
      <div className="form-builder__field form-builder__latlon">

        <label className="form-builder__label">
          {this.props.field.title}
        </label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }

        <div className='form-builder__item'>

          {value && <div><img src={this.getStaticImageUrl(value)}/></div>}

          <Button type="button" onClick={this.openModal}>
            {value ? _t('common.edit') : _t('formBuilder.fields.geo.setLocationButton') }
          </Button>

          { value && (
              <Button type="button" onClick={this.removeValue}>
                {_t('common.remove')}
              </Button>
            )
          }

          {this.state.modalOpen && (
            <Modal className="modal modal--map" visible={true}>
              <h1>{_t('formBuilder.fields.geo.placeOnMapHeader')}</h1>
              <p>{_t('formBuilder.fields.geo.placeOnMapDescription')}</p>
              <div>
                <GoogleMapLoadProxy
                  value={value}
                  defaultLatLon={this.props.field.googleMapsDefaultLatLon}
                  apiKey={this.props.field.googleMapsAPIKey}
                  locale={this.props.field.googleMapsLocale}
                  component={GeoPositionSelect}
                  onChange={this.handleLocationChange}
                />
              </div>
              <div className="modal-buttons">
                <Button className="primary" onClick={this.closeModal}>{_t('common.done')}</Button>
              </div>
            </Modal>
          )}

        </div>

        <FieldErrors errors={this.props.errors}/>

      </div>
    )
  }
})
