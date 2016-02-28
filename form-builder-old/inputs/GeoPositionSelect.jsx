import React from 'react'
import ControlledValue from '../mixins/ControlledValue'
import _t from '../../lib/translate'._t

export default React.createClass({

  displayName: 'GeoPositionSelect',

  mixins: [ControlledValue],

  getDefaultProps() {
    return {
      zoom: 8
    }
  },

  componentDidMount() {
    const {Map, places, event, Circle} = this.props.api
    const valueLatLon = this._getValueLatLon()
    const options = {
      zoom: this.props.zoom,
      center: valueLatLon
    }
    this._mapInstance = new Map(this.refs.map, options)
    this.declareMarker()

    const searchBounds = (new Circle({center: valueLatLon, radius: 100})).getBounds()
    const input = this.refs.searchInput
    const autoComplete = new places.Autocomplete(input, {
      bounds: searchBounds,
      types: ['geocode']
    })
    event.addListener(autoComplete, 'place_changed', this.handlePlaceChanged)
    this._autoComplete = autoComplete
  },

  _getValueLatLon() {
    const {LatLng} = this.props.api
    const value = this._getValue()
    let defaultLatLon = this.props.defaultLatLon
    defaultLatLon = defaultLatLon || [59.9127300, 10.7460900]
    return value ? new LatLng(value.lat, value.lon) : new LatLng(defaultLatLon[0], defaultLatLon[1])
  },

  declareMarker() {
    if (this._marker) {
      return this._marker
    }
    const {Marker, event} = this.props.api
    this._marker = new Marker({
      position: this._getValueLatLon(),
      map: this._mapInstance,
      draggable: true
    })
    event.addListener(this._marker, 'dragend', this.handleMarkerDragEnd)
  },

  handlePlaceChanged() {
    const place = this._autoComplete.getPlace()
    if (!place.geometry) {
      return
    }
    const selectedLocation = place.geometry.location
    this._setValue({lat: selectedLocation.lat(), lon: selectedLocation.lng()})
  },

  handleMarkerDragEnd(e) {
    this._setValue({lat: e.latLng.lat(), lon: e.latLng.lng()})
  },

  componentDidUpdate() {
    this._mapInstance.panTo(this._getValueLatLon())
    this._marker.setPosition(this._getValueLatLon())
    this.refs.searchInput.value = ''
  },

  render() {
    return (
      <div className="geo-position-select">
        <div className="geo-position-select__map" ref="map"/>
        <div className="geo-position-select__search-field">
          <input
            className="form-control geo-position-select__input"
            type="search"
            ref="searchInput"
            placeholder={_t('formBuilder.fields.geo.searchForAddressOrPlace')}
            name="place" />
        </div>
      </div>
    )
  }
})
