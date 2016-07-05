import React, {PropTypes} from 'react'
import {intlShape} from 'component:@sanity/base/locale/intl'
import {formatMessage} from 'role:@sanity/base/locale/formatters'
import SearchField from 'component:@sanity/components/textfields/default'

class GeopointSelect extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    zoom: PropTypes.number,
    api: PropTypes.shape({
      Map: PropTypes.func.isRequired,
      Circle: PropTypes.func.isRequired,
      Marker: PropTypes.func.isRequired,
      places: PropTypes.shape({Autocomplete: PropTypes.func.isRequired}),
      event: PropTypes.shape({addListener: PropTypes.func.isRequired})
    }).isRequired,
    defaultLocation: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    defaultZoom: PropTypes.number
  };

  static contextTypes = {
    intl: intlShape
  };

  static defaultProps = {
    defaultZoom: 8,
    defaultLocation: {lng: 10.7460900, lat: 59.9127300}
  };

  constructor(props) {
    super(props)

    this.elementRefs = {}
  }

  componentDidMount() {
    const {Map, Circle, places, event} = this.props.api
    const geoPoint = this.getValueLatLng()
    const options = {
      zoom: this.props.defaultZoom,
      center: geoPoint
    }

    this.mapInstance = new Map(this.elementRefs.map, options)
    this.declareMarker()

    const searchBounds = (new Circle({center: geoPoint, radius: 100})).getBounds()
    const input = this.elementRefs.searchInput
    this.autoComplete = new places.Autocomplete(input, {
      bounds: searchBounds,
      types: ['geocode']
    })

    event.addListener(
      this.autoComplete,
      'place_changed',
      this.handlePlaceChanged.bind(this)
    )
  }

  getValueLatLng() {
    const {api, value, defaultLocation} = this.props
    return value
      ? new api.LatLng(value.lat, value.lng)
      : new api.LatLng(defaultLocation.lat, defaultLocation.lng)
  }

  declareMarker() {
    if (this.marker) {
      return this.marker
    }

    const {Marker, event} = this.props.api
    this.marker = new Marker({
      position: this.getValueLatLng(),
      map: this.mapInstance,
      draggable: true
    })

    event.addListener(
      this.marker,
      'dragend',
      this.handleMarkerDragEnd.bind(this)
    )

    return this.marker
  }

  handlePlaceChanged() {
    const place = this.autoComplete.getPlace()
    if (!place.geometry) {
      return
    }

    this.setValue(place.geometry.location)
  }

  handleMarkerDragEnd(event) {
    this.setValue(event.latLng)
  }

  setValue(geoPoint) {
    this.props.onChange({
      patch: {
        $set: {
          lat: geoPoint.lat(),
          lng: geoPoint.lng()
        }
      }
    })
  }

  componentDidUpdate() {
    this.mapInstance.panTo(this.getValueLatLng())
    this.marker.setPosition(this.getValueLatLng())
    this.elementRefs.searchInput.value = ''
  }

  assignReference(type) {
    return el => {
      this.elementRefs[type] = el
    }
  }

  render() {
    return (
      <div className="geo-position-select">
        <div
          ref={this.assignReference('map')}
          className="geo-position-select__map"
          style={{width: '100%', height: '100%'}}
        />

        <div className="geo-position-select__search-field" style={{display: 'none'}}>
          <input
            name="place"
            ref={this.assignReference('searchInput')}
            placeholder={formatMessage('google-maps.searchInputPlaceholder')}
          />
        </div>
      </div>
    )
  }
}

export default GeopointSelect
