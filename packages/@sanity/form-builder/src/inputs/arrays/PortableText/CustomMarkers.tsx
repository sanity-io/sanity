import React from 'react'
import {Tooltip} from 'part:@sanity/components/tooltip'
import {CommentIcon} from '@sanity/icons'
import {Marker} from '@sanity/types'

type Props = {
  markers: Marker[]
}
// This is the fallback marker renderer if the block editor didn't get the 'renderCustomMarkers' prop
// You will probably only see this when you first start to play with custom markers as a developer
export default class Markers extends React.Component<Props> {
  static defaultProps = {
    markers: [],
  }

  handleCustomMarkerClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const {markers} = this.props
    console.log(markers) // eslint-disable-line no-console
  }

  render() {
    const {markers} = this.props
    const text = `${markers.length === 1 ? 'One' : markers.length} custom ${
      markers.length > 1 ? 'markers' : 'marker'
    }, click to log to console.`

    return (
      <Tooltip content={text}>
        <CommentIcon onClick={this.handleCustomMarkerClick} />
      </Tooltip>
    )
  }
}
