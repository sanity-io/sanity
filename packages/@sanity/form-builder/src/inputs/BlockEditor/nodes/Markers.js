// @flow
import type {SlateChange, SlateValue} from './typeDefs'
import React from 'react'

import CustomMarkers from 'part:@sanity/form-builder/input/block-editor/custom-markers'
import ValidationStatus from 'part:@sanity/components/validation/status'

import styles from './styles/Markers.css'

type marker = {}

type Props = {
  editorValue: SlateValue,
  markers: marker[],
  onFocus: void => void,
  onChange: (change: SlateChange) => void
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
    const {markers} = this.props
    if (markers.length === 0) {
      return null
    }
    const customMarkers = markers.filter(mrkr => mrkr.type !== 'validation')
    const validationMarkers = markers.filter(mrkr => mrkr.type === 'validation')

    return (
      <div className={styles.markers} onClick={this.handleCancelEvent}>
        {validationMarkers.length > 0 && (
          <div className={styles.marker} onClick={this.handleValidationMarkerClick}>
            <ValidationStatus markers={validationMarkers} />
          </div>
        )}
        {customMarkers.length > 0 && (
          <div className={styles.marker} onClick={this.handleCancelEvent}>
            <CustomMarkers markers={customMarkers} />
          </div>
        )}
      </div>
    )
  }
}
