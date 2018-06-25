// @flow
import type {Marker, SlateChange, SlateValue} from './typeDefs'
import React from 'react'

import ValidationStatus from 'part:@sanity/components/validation/status'

import styles from './styles/Markers.css'

type marker = {}

type Props = {
  editorValue: SlateValue,
  markers: marker[],
  onFocus: void => void,
  onChange: (change: SlateChange) => void,
  renderCustomMarkers?: (Marker[]) => React.Node
}

export default class Markers extends React.Component<Props> {
  static defaultProps = {
    markers: []
  }

  handleValidationMarkerClick = (event: SyntheticMouseEvent<*>) => {
    event.preventDefault()
    event.stopPropagation()
    const {onFocus, onChange, editorValue, markers} = this.props
    const validationMarkers = markers.filter(mrkr => mrkr.type === 'validation')
    const change = editorValue.change()
    change.blur()
    onChange(change, onFocus(validationMarkers[0].path))
  }

  handleCancelEvent = event => {
    event.preventDefault()
    event.stopPropagation()
  }

  render() {
    const {markers, renderCustomMarkers} = this.props
    if (markers.length === 0) {
      return null
    }
    const customMarkers = markers.filter(mrkr => mrkr.type !== 'validation')
    const validationMarkers = markers.filter(mrkr => mrkr.type === 'validation')

    return (
      <div onClick={this.handleCancelEvent}>
        {validationMarkers.length > 0 && (
          <div className={styles.markerGroup} onClick={this.handleValidationMarkerClick}>
            <ValidationStatus markers={validationMarkers} />
          </div>
        )}
        {customMarkers.length > 0 && (
          <div className={styles.markerGroup} onClick={this.handleCancelEvent}>
            {renderCustomMarkers && renderCustomMarkers({markers: customMarkers})}
          </div>
        )}
      </div>
    )
  }
}
