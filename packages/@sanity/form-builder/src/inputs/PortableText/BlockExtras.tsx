import React from 'react'
import classNames from 'classnames'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/lib/change-indicators'
import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'
import {Marker, Path} from '@sanity/types'
import {PortableTextBlock} from '@sanity/portable-text-editor'
import {RenderCustomMarkers} from './types'
import styles from './BlockExtras.css'

type Props = {
  block: PortableTextBlock
  blockActions?: Node
  isFullscreen: boolean
  markers: Marker[]
  onFocus: (arg0: Path) => void
  renderCustomMarkers?: RenderCustomMarkers
}
export default function BlockExtras(props: Props) {
  const {block, blockActions, markers, onFocus, renderCustomMarkers, isFullscreen} = props
  const scopedValidation = getValidationMarkers(markers)
  const errors = scopedValidation.filter(mrkr => mrkr.level === 'error')
  const warnings = scopedValidation.filter(mrkr => mrkr.level === 'warning')
  const onlyChangeIndicators = markers.length === 0 && !blockActions
  return (
    <div
      className={classNames([
        styles.root,
        isFullscreen && styles.hasFullScreen,
        errors.length > 0 && styles.withError,
        warnings.length > 0 && !errors.length && styles.withWarning,
        !!onlyChangeIndicators && styles.withChangeIndicatorsOnly
      ])}
    >
      <ChangeIndicatorWithProvidedFullPath
        compareDeep
        value={block}
        hasFocus={false}
        path={[{_key: block._key}]}
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
          {/* {onlyChangeIndicators && <span>&#8203;</span>} */}
        </div>
      </ChangeIndicatorWithProvidedFullPath>
    </div>
  )
}

function getValidationMarkers(markers: Marker[]) {
  const validation = markers.filter(mrkr => mrkr.type === 'validation')
  return validation.map(mrkr => {
    if (mrkr.path.length <= 1) {
      return mrkr
    }
    const level = mrkr.level === 'error' ? 'errors' : 'warnings'
    return {
      ...mrkr,
      item: mrkr.item.cloneWithMessage(`Contains ${level}`)
    }
  })
}
