import React, { PropTypes } from 'react'
import {Map, Marker, TileLayer} from 'react-leaflet'
import {icon} from 'leaflet'
import FormField from 'part:@sanity/components/formfields/default'
import {ICON_URL, ICON_SHADOW} from './icons'

const ICON = icon({
  iconUrl: ICON_URL,
  iconShadow: ICON_SHADOW,
  iconAnchor: [12, 41],
})

const ATTRIBUTION = '&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'

function insertCSS(url) {
  const head = document.getElementsByTagName('head')[0]
  const link = document.createElement('link')

  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('href', url)
  head.appendChild(link)
  return link
}

const DEFAULTS = {
  zoom: 8,
  center: {lng: 10.7460900, lat: 59.9127300}
}

function getOptions(type) {
  if (!type.options) {
    return DEFAULTS
  }
  return {...DEFAULTS, ...type.options}
}

export default class GeoPoint extends React.Component {

  static propTypes = {
    type: PropTypes.object,
    value: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    level: PropTypes.number,
    onChange: PropTypes.func,
  }

  state = {
    zoom: null
  }
  componentDidMount() {
    insertCSS('https://unpkg.com/leaflet@1.0.3/dist/leaflet.css')
  }

  handleMarkDragEnd = () => {
    this.setLatLng(this.marker.leafletElement.getLatLng())
  }

  setLatLng(latLng) {
    const {lat, lng} = latLng
    const {onChange} = this.props
    onChange({
      patch: {
        type: 'set',
        value: {_type: 'geopoint', lat, lng}
      }
    })
  }

  handleZoomEnd = ev => {
    this.setState({zoom: this.map.leafletElement.getZoom()})
  }

  handleClick = ev => {
    this.setLatLng(ev.latlng)
  }

  setMap = map => {
    this.map = map
  }
  setMarker = marker => {
    this.marker = marker
  }

  render() {
    const {type, level, value} = this.props
    const opts = getOptions(type)
    const center = value || opts.center

    const markerCoords = value || center
    const zoom = this.state.zoom || opts.zoom

    return (
      <FormField label={type.title} labelHtmlFor={this.inputId} level={level} description={type.description}>
        <Map
          ref={this.setMap}
          scrollWheelZoom={false}
          animate
          onClick={this.handleClick}
          onZoomEnd={this.handleZoomEnd}
          center={[center.lat, center.lng]}
          zoom={zoom}
          style={{height: 300, width: '100%'}}
        >
          <TileLayer
            attribution={ATTRIBUTION}
            url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
          />
          <Marker
            icon={ICON}
            draggable
            onDragend={this.handleMarkDragEnd}
            position={[markerCoords.lat, markerCoords.lng]}
            ref={this.setMarker}
          />
        </Map>
      </FormField>
    )
  }
}
