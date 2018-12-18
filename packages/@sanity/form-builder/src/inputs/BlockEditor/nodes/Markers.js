// @flow
import React from 'react'

import ValidationStatus from 'part:@sanity/components/validation/status'
import CustomMarkers from 'part:@sanity/form-builder/input/block-editor/block-markers-custom-default'

import type {Marker, Path, RenderCustomMarkers, SlateEditor} from '../typeDefs'

import styles from './styles/Markers.css'

type Props = {
  editor: SlateEditor,
  markers: Marker[],
  onFocus: Path => void,
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
    const {editor, onFocus, markers} = this.props
    const validationMarkers = markers.filter((mrkr: Marker) => mrkr.type === 'validation')
    editor.blur()
    setTimeout(() => {
      onFocus(validationMarkers[0].path)
    }, 200)
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
