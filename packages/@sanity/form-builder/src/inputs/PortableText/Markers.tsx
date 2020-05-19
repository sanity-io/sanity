import React from 'react'
import ValidationStatus from 'part:@sanity/components/validation/status'
import CustomMarkers from 'part:@sanity/form-builder/input/block-editor/block-markers-custom-default'
import {Marker} from '../../typedefs/index'
import {Path} from '../../typedefs/path'
import {RenderCustomMarkers} from './types'
import styles from './Markers.css'

type Props = {
  markers: Marker[]
  onFocus: (arg0: Path) => void
  renderCustomMarkers?: RenderCustomMarkers
}
export default class Markers extends React.PureComponent<Props> {
  static defaultProps = {
    markers: [],
    renderCustomMarkers: null
  }
  handleValidationMarkerClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    const {onFocus, markers} = this.props
    const validationMarkers = markers.filter((mrkr: Marker) => mrkr.type === 'validation')
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
