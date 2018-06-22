// @flow
import type {SlateChange, SlateValue, Block} from '../typeDefs'
import React from 'react'
import classNames from 'classnames'

import BlockActions from 'part:@sanity/form-builder/input/block-editor/block-actions?'
import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'

import styles from './styles/BlockExtras.css'

type marker = {}

type Props = {
  editorValue: SlateValue,
  markers: marker[],
  onFocus: void => void,
  onChange: (change: SlateChange) => void,
  block: Block
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
    const {block, markers, onFocus, onChange, editorValue} = this.props
    const scopedValidation = this.getValidationMarkers()
    const errors = scopedValidation.filter(mrkr => mrkr.level === 'error')
    const warnings = scopedValidation.filter(mrkr => mrkr.level === 'warning')
    return (
      <div
        className={classNames([
          (BlockActions || markers.length > 0) && styles.withSomething,
          errors.length > 0 && styles.withError,
          warnings.length > 0 && !errors.length && styles.withWarning
        ])}
        contentEditable={false}
      >
        {BlockActions && (
          <div className={styles.blockActions}>
            <BlockActions block={block} />
          </div>
        )}
        {markers.length > 0 && (
          <div className={styles.markers}>
            <Markers
              className={styles.markers}
              markers={markers}
              scopedValidation={scopedValidation}
              onFocus={onFocus}
              onChange={onChange}
              editorValue={editorValue}
            />
          </div>
        )}
      </div>
    )
  }
}
