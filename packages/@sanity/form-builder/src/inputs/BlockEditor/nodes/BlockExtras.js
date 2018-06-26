// @flow
import type {Marker, SlateChange, SlateValue, Block} from '../typeDefs'
import React from 'react'
import classNames from 'classnames'

import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'

import styles from './styles/BlockExtras.css'

type marker = {}

type Props = {
  editorValue: SlateValue,
  markers: marker[],
  onChange: (change: SlateChange) => void,
  onFocus: void => void,
  blockActions?: React.Node,
  renderCustomMarkers?: (Marker[]) => React.Node
}

export default class BlockExtras extends React.PureComponent<Props> {
  static defaultProps = {
    markers: []
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

  render() {
    const {markers, onFocus, onChange, editorValue, blockActions, renderCustomMarkers} = this.props
    const scopedValidation = this.getValidationMarkers()
    const errors = scopedValidation.filter(mrkr => mrkr.level === 'error')
    const warnings = scopedValidation.filter(mrkr => mrkr.level === 'warning')
    return (
      <div
        className={classNames([
          styles.root,
          (blockActions || markers.length > 0) && styles.withSomething,
          errors.length > 0 && styles.withError,
          warnings.length > 0 && !errors.length && styles.withWarning
        ])}
        suppressContentEditableWarning
        contentEditable="false"
      >
        {blockActions && <div className={styles.blockActions}>{blockActions}</div>}
        {markers.length > 0 && (
          <div className={styles.markers}>
            <Markers
              className={styles.markers}
              markers={markers}
              scopedValidation={scopedValidation}
              onFocus={onFocus}
              onChange={onChange}
              editorValue={editorValue}
              renderCustomMarkers={renderCustomMarkers}
            />
          </div>
        )}
      </div>
    )
  }
}
