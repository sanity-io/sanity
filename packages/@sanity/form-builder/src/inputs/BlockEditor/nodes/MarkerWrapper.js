// @flow
import type {Node} from 'react'
import React from 'react'

import {Tooltip} from '@sanity/react-tippy'
import Button from 'part:@sanity/components/buttons/default'
import CommentIcon from 'part:@sanity/base/comment-icon'

import styles from './styles/MarkerWrapper.css'

type marker = {}

type Props = {
  children: Node,
  markers: marker[]
}

export default class MarkerWrapper extends React.Component<Props> {
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
    const {children, markers} = this.props
    const customMarkers = markers.filter(mrkr => mrkr.type !== 'validation')
    if (customMarkers.length === 0) {
      return <div>{children}</div>
    }
    const text = `${customMarkers.length} custom ${
      customMarkers.length > 1 ? 'markers' : 'marker'
    }, click to log to console.`
    return (
      <div className={styles.root}>
        <div className={styles.content}>{children}</div>
        {customMarkers.length > 0 && (
          <div className={styles.markers}>
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
