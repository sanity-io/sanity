import * as React from 'react'
import {LatLng} from '../types'
import {latLngAreEqual} from './util'

const markerPath =
  'M 3.052 3.7 C 1.56 5.293 0.626 7.612 0.663 9.793 C 0.738 14.352 2.793 16.077 6.078 22.351 C 7.263 25.111 8.497 28.032 9.672 32.871 C 9.835 33.584 9.994 34.246 10.069 34.305 C 10.143 34.362 10.301 33.697 10.465 32.983 C 11.639 28.145 12.875 25.226 14.059 22.466 C 17.344 16.192 19.398 14.466 19.474 9.908 C 19.511 7.727 18.574 5.405 17.083 3.814 C 15.379 1.994 12.809 0.649 10.069 0.593 C 7.328 0.536 4.756 1.882 3.052 3.7 Z'

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
  color?: {background: string; border: string; text: string}
}

export class Marker extends React.PureComponent<Props> {
  marker: google.maps.Marker | undefined

  eventHandlers: {
    move?: google.maps.MapsEventListener
    click?: google.maps.MapsEventListener
  } = {}

  componentDidMount() {
    const {position, api, map, onMove, zIndex, opacity, label, markerRef, color} = this.props
    const {Marker: GMarker} = api

    let icon: google.maps.ReadonlySymbol | undefined
    if (color) {
      icon = {
        path: markerPath,
        fillOpacity: 1,
        fillColor: color.background,
        strokeColor: color.border,
        strokeWeight: 2,
        anchor: new api.Point(10, 35),
        labelOrigin: new api.Point(10, 11)
      }
    }

    this.marker = new GMarker({
      draggable: Boolean(onMove),
      position,
      map,
      zIndex,
      opacity,
      label,
      icon
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

    if (!latLngAreEqual(prevProps.position, position)) {
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
