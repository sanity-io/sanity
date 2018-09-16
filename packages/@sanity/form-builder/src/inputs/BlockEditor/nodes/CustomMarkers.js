// @flow
import React from 'react'

import {Tooltip} from '@sanity/react-tippy'
import CommentIcon from 'part:@sanity/base/comment-icon'
import type {Marker} from '../typeDefs'

type Props = {
  markers: Marker[]
}

// This is the fallback marker renderer if the block editor didn't get the 'renderCustomMarkers' prop
// You will probably only see this when you first start to play with custom markers as a developer

export default class Markers extends React.Component<Props> {
  static defaultProps = {
    markers: []
  }

  handleCustomMarkerClick = (event: SyntheticMouseEvent<>) => {
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
      <Tooltip
        title={text}
        trigger="mouseenter focus"
        animation="scale"
        arrow
        theme="light"
        distance="2"
        duration={50}
      >
        <CommentIcon onClick={this.handleCustomMarkerClick} />
      </Tooltip>
    )
  }
}
