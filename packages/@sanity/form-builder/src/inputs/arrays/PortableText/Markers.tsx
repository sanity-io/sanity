import React from 'react'
import {FormFieldValidationStatus} from '@sanity/base/components'
import {Path, Marker, isValidationMarker} from '@sanity/types'
import {CustomMarkers} from '../../../legacyParts'
import {RenderCustomMarkers} from './types'
import styles from './Markers.css'

type Props = {
  markers: Marker[]
  onFocus: (path: Path) => void
  renderCustomMarkers?: RenderCustomMarkers
}
export default class Markers extends React.PureComponent<Props> {
  static defaultProps = {
    markers: [],
    renderCustomMarkers: null,
  }
  handleValidationMarkerClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    const {onFocus, markers} = this.props
    const validationMarkers = markers.filter(isValidationMarker)
    onFocus(validationMarkers[0].path)
  }
  handleCancelEvent = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.stopPropagation()
  }
  render(): JSX.Element {
    const {markers, renderCustomMarkers} = this.props
    if (markers.length === 0) {
      return null
    }
    const customMarkers = markers.filter((mrkr) => !isValidationMarker(mrkr))
    const validationMarkers = markers.filter(isValidationMarker)
    return (
      <div onClick={this.handleCancelEvent} className={styles.root}>
        {validationMarkers.length > 0 && (
          <div className={styles.markerGroup} onClick={this.handleValidationMarkerClick}>
            <FormFieldValidationStatus markers={validationMarkers} />
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
