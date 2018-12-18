// @flow
import type {Node} from 'react'
import React from 'react'
import classNames from 'classnames'

import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'

import type {Marker, SlateEditor, Path, RenderCustomMarkers} from './typeDefs'
import styles from './styles/BlockExtras.css'

type Props = {
  blockActions?: Node,
  editor: SlateEditor,
  fullscreen: boolean,
  markers: Marker[],
  onFocus: Path => void,
  renderCustomMarkers?: RenderCustomMarkers
}

export default class BlockExtras extends React.PureComponent<Props> {
  static defaultProps = {
    markers: [],
    blockActions: null,
    renderCustomMarkers: null
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
    const {blockActions, editor, markers, onFocus, renderCustomMarkers, fullscreen} = this.props
    const scopedValidation = this.getValidationMarkers()
    const errors = scopedValidation.filter(mrkr => mrkr.level === 'error')
    const warnings = scopedValidation.filter(mrkr => mrkr.level === 'warning')
    return (
      <div
        className={classNames([
          styles.root,
          fullscreen && styles.hasFullScreen,
          (blockActions || markers.length > 0) && styles.withSomething,
          errors.length > 0 && styles.withError,
          warnings.length > 0 && !errors.length && styles.withWarning
        ])}
      >
        <div className={styles.content}>
          {markers.length > 0 && (
            <div className={styles.markers}>
              <Markers
                className={styles.markers}
                editor={editor}
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
