// @flow
import React from 'react'

import ValidationStatus from 'part:@sanity/components/validation/status'
import CustomMarkers from 'part:@sanity/form-builder/input/block-editor/block-markers-custom-default'

import type {
  Marker,
  Path,
  RenderCustomMarkers,
  SlateChange,
  SlateController,
  SlateValue
} from '../typeDefs'

import styles from './styles/Markers.css'

type Props = {
  controller: SlateController,
  editorValue: SlateValue,
  markers: Marker[],
  onFocus: Path => void,
  onChange: (change: SlateChange, callback?: (SlateChange) => void) => void,
  renderCustomMarkers?: RenderCustomMarkers
}

export default class Markers extends React.Component<Props> {
  static defaultProps = {
    markers: [],
    renderCustomMarkers: null
  }

  handleValidationMarkerClick = (event: SyntheticMouseEvent<*>) => {
    event.preventDefault()
    event.stopPropagation()
    const {controller, onFocus, onChange, markers} = this.props
    const validationMarkers = markers.filter((mrkr: Marker) => mrkr.type === 'validation')
    controller.change(change => {
      change.blur()
    })
    alert('Fixme!')
    // onChange(change, () => onFocus(validationMarkers[0].path))
  }

  handleCancelEvent = (event: SyntheticMouseEvent<*>) => {
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
      <div onClick={this.handleCancelEvent} className={styles.root}>
        {validationMarkers.length > 0 && (
          <div className={styles.markerGroup} onClick={this.handleValidationMarkerClick}>
            <ValidationStatus markers={validationMarkers} />
          </div>
        )}
        {customMarkers.length > 0 && (
          <div className={styles.markerGroup} onClick={this.handleCancelEvent}>
            {renderCustomMarkers && renderCustomMarkers(customMarkers)}
            {!renderCustomMarkers && <CustomMarkers markers={markers} />}
          </div>
        )}
      </div>
    )
  }
}
