import React from 'react'
import {isEqual} from 'lodash'
import classNames from 'classnames'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/lib/change-indicators'
import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'
import {Marker, Path} from '@sanity/types'
import {
  PortableTextBlock,
  PortableTextEditor,
  usePortableTextEditor
} from '@sanity/portable-text-editor'
import {RenderCustomMarkers} from './types'
import styles from './BlockExtras.css'

type Props = {
  block: PortableTextBlock
  blockActions?: Node
  height: number
  isFullscreen: boolean
  markers: Marker[]
  onFocus: (arg0: Path) => void
  renderCustomMarkers?: RenderCustomMarkers
  top: number
}
export default function BlockExtras(props: Props) {
  const {
    block,
    blockActions,
    height,
    isFullscreen,
    markers,
    onFocus,
    renderCustomMarkers,
    top
  } = props
  const scopedValidation = getValidationMarkers(markers)
  const errors = scopedValidation.filter(mrkr => mrkr.level === 'error')
  const warnings = scopedValidation.filter(mrkr => mrkr.level === 'warning')
  const editor = usePortableTextEditor()
  const selection = PortableTextEditor.getSelection(editor)
  const hasFocus = selection && isEqual(selection.focus.path[0], {_key: block._key})
  return (
    <div
      className={classNames([
        styles.root,
        isFullscreen && styles.hasFullScreen,
        errors.length > 0 && styles.withError,
        warnings.length > 0 && !errors.length && styles.withWarning
      ])}
    >
      <ChangeIndicatorWithProvidedFullPath
        compareDeep
        value={block}
        hasFocus={hasFocus}
        path={[{_key: block._key}]}
      >
        <div className={styles.content} style={{height: `${height}px`}}>
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
