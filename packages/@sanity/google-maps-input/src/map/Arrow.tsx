import * as React from 'react'
import {LatLng} from '../types'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  from: LatLng
  to: LatLng
  color?: string
  zIndex?: number
  arrowRef?: React.MutableRefObject<google.maps.Polyline | undefined>
  onClick?: (event: google.maps.MouseEvent) => void
}

export class Arrow extends React.Component<Props> {
  line: google.maps.Polyline | undefined

  eventHandlers: {
    click?: google.maps.MapsEventListener
  } = {}

  componentDidMount() {
    const {from, to, api, map, zIndex, onClick, color, arrowRef} = this.props
    const lineSymbol = {
      path: api.SymbolPath.FORWARD_OPEN_ARROW
    }

    this.line = new api.Polyline({
      map,
      zIndex,
      path: [from, to],
      icons: [{icon: lineSymbol, offset: '50%'}],
      strokeOpacity: 0.8,
      strokeColor: color || 'black'
    })

    if (onClick) {
      this.eventHandlers.click = api.event.addListener(this.line, 'click', onClick)
    }

    if (arrowRef) {
      arrowRef.current = this.line
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.line) {
      return
    }

    const {from, to, map} = this.props
    if (prevProps.from !== from || prevProps.to !== to) {
      this.line.setPath([from, to])
    }

    if (prevProps.map !== map) {
      this.line.setMap(map)
    }
  }

  componentWillUnmount() {
    if (this.line) {
      this.line.setMap(null)
    }

    if (this.eventHandlers.click) {
      this.eventHandlers.click.remove()
    }
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return null
  }
}
