// @flow
import type {Node} from 'react'
import React from 'react'

import {Tooltip} from '@sanity/react-tippy'
import CommentIcon from 'part:@sanity/base/comment-icon'

import styles from './styles/Markers.css'

type marker = {}

type Props = {
  markers: marker[]
}

export default class Markers extends React.Component<Props> {
  static defaultProps = {
    markers: []
  }

  handleClick = event => {
    event.preventDefault()
    event.stopPropagation()
    const {markers} = this.props
    console.log(markers) // eslint-disable-line no-console
  }

  render() {
    const {markers} = this.props
    const customMarkers = markers.filter(mrkr => mrkr.type !== 'validation')
    if (customMarkers.length === 0) {
      return <div className={styles.root} contentEditable={false} />
    }
    const text = `${customMarkers.length} custom ${
      customMarkers.length > 1 ? 'markers' : 'marker'
    }, click to log to console.`
    return (
      <div className={styles.markers} contentEditable={false}>
        {customMarkers.length > 0 && (
          <div className={styles.marker}>
            <Tooltip
              title={text}
              trigger="mouseenter focus"
              animation="scale"
              arrow
              theme="light"
              distance="2"
              duration={50}
            >
              <CommentIcon onClick={this.handleClick} />
            </Tooltip>
          </div>
        )}
      </div>
    )
  }
}
