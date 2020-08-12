import React from 'react'
import styles from './styles/GeopointSelect.css'
import {LatLng, Geopoint} from './types'

const fallbackLatLng: LatLng = {lat: 40.7058254, lng: -74.1180863}

interface SelectProps {
  api: typeof window.google.maps
  value?: Geopoint
  onChange: (latLng: google.maps.LatLng) => void
  defaultLocation?: LatLng
  defaultZoom?: number
}

export class GeopointSelect extends React.Component<SelectProps> {
  static defaultProps = {
    defaultZoom: 8,
    defaultLocation: {lng: 10.74609, lat: 59.91273}
  }

  map: google.maps.Map | undefined
  marker: google.maps.Marker | undefined
  autoComplete: google.maps.places.Autocomplete | undefined

  mapRef = React.createRef<HTMLDivElement>()
  searchInputRef = React.createRef<HTMLInputElement>()

  componentDidMount() {
    if (!this.mapRef.current || !this.searchInputRef.current) {
      // Shouldn't ever happen, but for typescript
      return
    }

    const {Circle, places, event} = this.props.api
    const GMap = this.props.api.Map
    const geoPoint = this.getValueLatLng()
    const options = {
      zoom: this.props.defaultZoom,
      center: geoPoint
    }

    this.map = new GMap(this.mapRef.current, options)
    this.marker = this.getMarker()

    const searchBounds = new Circle({center: geoPoint, radius: 100}).getBounds()
    const input = this.searchInputRef.current
    this.autoComplete = new places.Autocomplete(input, {
      bounds: searchBounds,
      types: [] // return all kinds of places
    })

    event.addListener(this.autoComplete, 'place_changed', this.handlePlaceChanged.bind(this))

    event.addListener(this.map, 'click', clickEvent => {
      this.setValue(clickEvent.latLng)
    })
  }

  getValueLatLng(): google.maps.LatLng {
    const {api, value = {}, defaultLocation = {}} = this.props
    const point = {...fallbackLatLng, ...defaultLocation, ...value}
    return new api.LatLng(point.lat, point.lng)
  }

  getMarker(): google.maps.Marker {
    if (this.marker) {
      return this.marker
    }

    const {Marker, event} = this.props.api
    const marker = new Marker({
      position: this.getValueLatLng(),
      map: this.map,
      draggable: true
    })

    event.addListener(marker, 'dragend', this.handleMarkerDragEnd)

    return marker
  }

  handlePlaceChanged() {
    if (!this.autoComplete) {
      return
    }

    const place = this.autoComplete.getPlace()
    if (!place.geometry) {
      return
    }

    this.setValue(place.geometry.location)
  }

  handleMarkerDragEnd = event => {
    this.setValue(event.latLng)
  }

  setValue(geoPoint) {
    this.props.onChange(geoPoint)
  }

  componentDidUpdate() {
    if (!this.map || !this.marker || !this.searchInputRef.current) {
      return
    }

    this.map.panTo(this.getValueLatLng())
    this.marker.setPosition(this.getValueLatLng())
    this.searchInputRef.current.value = ''
  }

  render() {
    return (
      <div className={styles.wrapper}>
        <div ref={this.mapRef} className={styles.map} />
        <div className={styles.searchInput}>
          <input
            name="place"
            ref={this.searchInputRef}
            placeholder="Search for place or address"
            className={styles.input}
          />
        </div>
      </div>
    )
  }
}
