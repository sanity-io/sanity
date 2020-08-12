import * as React from 'react'
import {LatLng} from '../types'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  onMove?: (event: google.maps.MouseEvent) => void
  onClick?: (event: google.maps.MouseEvent) => void
  onMouseOver?: (event: google.maps.MouseEvent) => void
  onMouseOut?: (event: google.maps.MouseEvent) => void
  position: LatLng | google.maps.LatLng
  zIndex?: number
  opacity?: number
  label?: string
  markerRef?: React.MutableRefObject<google.maps.Marker | undefined>
}

export class Marker extends React.Component<Props> {
  marker: google.maps.Marker | undefined

  eventHandlers: {
    move?: google.maps.MapsEventListener
    click?: google.maps.MapsEventListener
  } = {}

  componentDidMount() {
    const {position, api, map, onMove, zIndex, opacity, label, markerRef} = this.props
    const {Marker: GMarker} = api

    this.marker = new GMarker({
      position,
      map,
      draggable: Boolean(onMove),
      zIndex,
      opacity,
      label
    })

    if (markerRef) {
      markerRef.current = this.marker
    }

    this.attachMoveHandler()
    this.attachClickHandler()
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.marker) {
      return
    }

    const {position, onMove, label, zIndex, opacity, map} = this.props

    if (prevProps.onMove !== onMove) {
      this.attachMoveHandler()
    }

    if (prevProps.position !== position) {
      this.marker.setPosition(position)
    }

    if (prevProps.label !== label) {
      this.marker.setLabel(label || null)
    }

    if (prevProps.zIndex !== zIndex) {
      this.marker.setZIndex(zIndex || null)
    }

    if (prevProps.opacity !== opacity) {
      this.marker.setOpacity(opacity || null)
    }

    if (prevProps.map !== map) {
      this.marker.setMap(map)
    }
  }

  componentWillUnmount() {
    if (this.eventHandlers.move) {
      this.eventHandlers.move.remove()
    }

    if (this.marker) {
      this.marker.setMap(null)
    }
  }

  attachMoveHandler() {
    const {api, onMove} = this.props
    if (this.eventHandlers.move) {
      this.eventHandlers.move.remove()
    }
    if (this.marker && onMove) {
      this.eventHandlers.move = api.event.addListener(this.marker, 'dragend', onMove)
    }
  }

  attachClickHandler() {
    const {api, onClick} = this.props
    if (this.eventHandlers.click) {
      this.eventHandlers.click.remove()
    }
    if (this.marker && onClick) {
      this.eventHandlers.click = api.event.addListener(this.marker, 'click', onClick)
    }
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return null
  }
}
