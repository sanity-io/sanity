import * as React from 'react'
import {LatLng} from '../types'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  onMove?: (event: google.maps.MouseEvent) => void
  position: LatLng | google.maps.LatLng
  zIndex?: number
  opacity?: number
  label?: string
}

export class Marker extends React.Component<Props> {
  marker: google.maps.Marker | undefined

  moveHandler: google.maps.MapsEventListener | undefined

  componentDidMount() {
    const {position, api, map, onMove, zIndex, opacity, label} = this.props
    const {Marker: GMarker} = api
    this.marker = new GMarker({
      position,
      map,
      draggable: Boolean(onMove),
      zIndex,
      opacity,
      label
    })

    this.attachMoveHandler()
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.marker) {
      return
    }

    const {position, onMove, label, zIndex, opacity} = this.props

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
  }

  componentWillUnmount() {
    if (this.moveHandler) {
      this.moveHandler.remove()
    }
  }

  attachMoveHandler() {
    const {api, onMove} = this.props

    if (this.moveHandler) {
      this.moveHandler.remove()
    }

    if (this.marker && onMove) {
      this.moveHandler = api.event.addListener(this.marker, 'dragend', onMove)
    }
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return null
  }
}
