import React from 'react'
import classNames from 'classnames'
import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'
import {isValidationMarker, Marker, Path} from '@sanity/types'
import {RenderCustomMarkers} from './types'
import styles from './BlockExtras.css'

type Props = {
  blockActions?: Node
  isFullscreen: boolean
  markers: Marker[]
  onFocus: (arg0: Path) => void
  renderCustomMarkers?: RenderCustomMarkers
}
export default class BlockExtras extends React.PureComponent<Props, {}> {
  static defaultProps = {
    blockActions: null,
    renderCustomMarkers: null
  }
  getValidationMarkers() {
    const {markers} = this.props
    const validation = markers.filter(isValidationMarker)
    return validation.map(marker => {
      if (marker.path.length <= 1) {
        return marker
      }
      const level = marker.level === 'error' ? 'errors' : 'warnings'
      return {
        ...marker,
        item: marker.item.cloneWithMessage(`Contains ${level}`)
      }
    })
  }
  render(): JSX.Element {
    const {blockActions, markers, onFocus, renderCustomMarkers, isFullscreen} = this.props
    const scopedValidation = this.getValidationMarkers()
    const errors = scopedValidation.filter(mrkr => mrkr.level === 'error')
    const warnings = scopedValidation.filter(mrkr => mrkr.level === 'warning')
    return (
      <div
        className={classNames([
          styles.root,
          isFullscreen && styles.hasFullScreen,
          errors.length > 0 && styles.withError,
          warnings.length > 0 && !errors.length && styles.withWarning
        ])}
      >
        <div className={styles.content}>
          {markers.length > 0 && (
            <div className={styles.markers}>
              <Markers
                className={styles.markers}
                markers={markers}
                scopedValidation={scopedValidation}
                onFocus={onFocus}
                renderCustomMarkers={renderCustomMarkers}
              />
            </div>
          )}
          {blockActions && <div className={styles.blockActions}>{blockActions}</div>}
        </div>
      </div>
    )
  }
}
