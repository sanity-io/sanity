// @flow
import type {SlateChange, SlateValue} from './typeDefs'
import React from 'react'
import classNames from 'classnames'

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
    const {onFocus, onChange, editorValue} = this.props
    const change = editorValue.change()
    change.blur()
    onChange(change, onFocus(this.getValidationMarkers()[0].path))
  }

  getValidationMarkers() {
    const {markers} = this.props
    const validation = markers.filter(mrkr => mrkr.type === 'validation')
    return validation.map(mrkr => {
      if (mrkr.path.length <= 1) {
        return mrkr
      }
      const level = mrkr.level === 'error' ? 'errors' : 'warnings'
      return Object.assign({}, mrkr, {
        item: mrkr.item.cloneWithMessage(`Contains ${level}`)
      })
    })
  }

  handleCancelEvent = event => {
    event.preventDefault()
    event.stopPropagation()
  }

  render() {
    const {markers} = this.props
    if (markers.length === 0) {
      return <div className={styles.root} contentEditable={false} />
    }
    const customMarkers = markers.filter(mrkr => mrkr.type !== 'validation')

    const scopedValidation = this.getValidationMarkers()
    const errors = scopedValidation.filter(mrkr => mrkr.level === 'error')
    const warnings = scopedValidation.filter(mrkr => mrkr.level === 'warning')

    return (
      <div
        className={classNames([
          styles.markers,
          errors.length > 0 && styles.markersWithError,
          warnings.length > 0 && !errors.length && styles.markersWithWarning
        ])}
        contentEditable={false}
        onClick={this.handleCancelEvent}
      >
        {customMarkers.length > 0 && (
          <div className={styles.marker} onClick={this.handleCancelEvent}>
            <CustomMarkers markers={customMarkers} />
          </div>
        )}
        {scopedValidation.length > 0 && (
          <div className={styles.marker} onClick={this.handleValidationMarkerClick}>
            <ValidationStatus markers={scopedValidation} />
          </div>
        )}
      </div>
    )
  }
}
