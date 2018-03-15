import PropTypes from 'prop-types'
import React from 'react'
import styles from '../styles/GeopointSelect.css'

class GeopointSelect extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
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
  }

  static defaultProps = {
    defaultZoom: 8,
    defaultLocation: {lng: 10.74609, lat: 59.91273}
  }

  constructor(props) {
    super(props)

    this.elementRefs = {}
  }

  componentDidMount() {
    const {Circle, places, event} = this.props.api
    const GMap = this.props.api.Map
    const geoPoint = this.getValueLatLng()
    const options = {
      zoom: this.props.defaultZoom,
      center: geoPoint
    }

    this.mapInstance = new GMap(this.elementRefs.map, options)
    this.declareMarker()

    const searchBounds = new Circle({center: geoPoint, radius: 100}).getBounds()
    const input = this.elementRefs.searchInput
    this.autoComplete = new places.Autocomplete(input, {
      bounds: searchBounds,
      types: [] // return all kinds of places
    })

    event.addListener(this.autoComplete, 'place_changed', this.handlePlaceChanged.bind(this))

    event.addListener(this.mapInstance, 'click', clickEvent => {
      this.setValue(clickEvent.latLng)
    })
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

    event.addListener(this.marker, 'dragend', this.handleMarkerDragEnd.bind(this))

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
    this.props.onChange(geoPoint)
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
      <div className={styles.wrapper}>
        <div ref={this.assignReference('map')} className={styles.map} />
        <div className={styles.searchInput}>
          <input
            name="place"
            ref={this.assignReference('searchInput')}
            placeholder="Search for place or address"
            className={styles.input}
          />
        </div>
      </div>
    )
  }
}

export default GeopointSelect
