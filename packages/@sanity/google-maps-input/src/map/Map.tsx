import React from 'react'
import {LatLng} from '../types'
import styles from './Map.css'

interface MapProps {
  api: typeof window.google.maps
  location: LatLng
  bounds?: google.maps.LatLngBounds
  defaultZoom?: number
  mapTypeControl?: boolean
  controlSize?: number
  onClick?: (event: google.maps.MouseEvent) => void
  children?: (map: google.maps.Map) => React.ReactElement
}

interface MapState {
  map: google.maps.Map | undefined
}

export class GoogleMap extends React.Component<MapProps, MapState> {
  static defaultProps = {
    defaultZoom: 8
  }

  state: MapState = {map: undefined}
  clickHandler: google.maps.MapsEventListener | undefined
  mapRef = React.createRef<HTMLDivElement>()
  mapEl: HTMLDivElement | null = null

  componentDidMount() {
    this.attachClickHandler()
  }

  attachClickHandler() {
    const map = this.state.map
    if (!map) {
      return
    }

    const {api, onClick} = this.props
    const {event} = api

    if (this.clickHandler) {
      this.clickHandler.remove()
    }

    if (onClick) {
      this.clickHandler = event.addListener(map, 'click', onClick)
    }
  }

  componentDidUpdate(prevProps: MapProps) {
    const map = this.state.map
    if (!map) {
      return
    }

    const {onClick, location, bounds} = this.props

    if (prevProps.onClick !== onClick) {
      this.attachClickHandler()
    }

    if (prevProps.location !== location) {
      map.panTo(this.getCenter())
    }

    if (prevProps.bounds !== bounds && bounds) {
      map.fitBounds(bounds)
    }
  }

  componentWillUnmount() {
    if (this.clickHandler) {
      this.clickHandler.remove()
    }
  }

  getCenter(): google.maps.LatLng {
    const {location, api} = this.props
    return new api.LatLng(location.lat, location.lng)
  }

  constructMap(el: HTMLDivElement) {
    const {defaultZoom, api, mapTypeControl, controlSize, bounds} = this.props

    const map = new api.Map(el, {
      zoom: defaultZoom,
      center: this.getCenter(),
      streetViewControl: false,
      mapTypeControl,
      controlSize
    })

    if (bounds) {
      map.fitBounds(bounds)
    }

    return map
  }

  setMapElement = (element: HTMLDivElement | null) => {
    if (element && element !== this.mapEl) {
      const map = this.constructMap(element)
      this.setState({map})
    }

    this.mapEl = element
  }

  render() {
    const {children} = this.props
    const {map} = this.state
    return (
      <>
        <div ref={this.setMapElement} className={styles.map} />
        {children && map ? children(map) : null}
      </>
    )
  }
}
