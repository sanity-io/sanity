import React, {useMemo} from 'react'
import classNames from 'classnames'
import {Marker, Path} from '@sanity/types'
import {RenderAttributes} from '@sanity/portable-text-editor'
import {Markers} from '../../../legacyParts'
import {RenderCustomMarkers} from '../types'
import styles from './BlockExtras.module.css'

type Props = {
  attributes: RenderAttributes
  blockActions?: JSX.Element
  markers: Marker[]
  onFocus: (path: Path) => void
  renderCustomMarkers?: RenderCustomMarkers
}
export default function BlockExtras(props: Props) {
  const {attributes, blockActions, markers, onFocus, renderCustomMarkers} = props
  const blockValidation = getValidationMarkers(markers)
  const errors = blockValidation.filter((mrkr) => mrkr.level === 'error')
  const warnings = blockValidation.filter((mrkr) => mrkr.level === 'warning')
  const empty = markers.length === 0 && !blockActions
  const content = useMemo(
    () => (
      <div className={styles.content}>
        {markers.length > 0 && (
          <div className={styles.markers}>
            <Markers
              className={styles.markers}
              markers={markers}
              scopedValidation={blockValidation}
              onFocus={onFocus}
              renderCustomMarkers={renderCustomMarkers}
            />
          </div>
        )}
        {blockActions && <div className={styles.blockActions}>{blockActions}</div>}
        {/* Make sure it gets proper height (has content). Insert an zero-width-space if empty */}
        {empty && <>&#8203;</>}
      </div>
    ),
    [blockActions, blockValidation, empty, markers, onFocus, renderCustomMarkers]
  )
  const activeClassNames = useMemo(
    () =>
      classNames([
        styles.root,
        attributes.focused && styles.hasFocus,
        errors.length > 0 && styles.withError,
        warnings.length > 0 && !errors.length && styles.withWarning,
      ]),
    [attributes.focused, errors.length, warnings.length]
  )
  return <div className={activeClassNames}>{content}</div>
}

function getValidationMarkers(markers: Marker[]) {
  const validation = markers.filter((mrkr) => mrkr.type === 'validation')
  return validation.map((mrkr) => {
    if (mrkr.path.length <= 1) {
      return mrkr
    }
    const level = mrkr.level === 'error' ? 'errors' : 'warnings'
    return {
      ...mrkr,
      item: mrkr.item.cloneWithMessage(`Contains ${level}`),
    }
  })
}
