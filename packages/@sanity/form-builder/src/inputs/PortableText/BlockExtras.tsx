import React from 'react'
import {isEqual} from 'lodash'
import classNames from 'classnames'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/lib/change-indicators'
import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'
import {isKeySegment, Marker, Path} from '@sanity/types'
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
}
export default function BlockExtras(props: Props) {
  const editor = usePortableTextEditor()
  const {block, blockActions, height, isFullscreen, markers, onFocus, renderCustomMarkers} = props
  const blockValidation = getValidationMarkers(markers)
  const errors = blockValidation.filter(mrkr => mrkr.level === 'error')
  const warnings = blockValidation.filter(mrkr => mrkr.level === 'warning')
  const selection = PortableTextEditor.getSelection(editor)
  const hasFocus = !!selection && isEqual(selection.focus.path[0], {_key: block._key})
  const empty = markers.length === 0 && !blockActions
  const content = (
    <div className={styles.content} style={{height: `${height}px`}}>
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
  )
  const path = PortableTextEditor.getSelection(editor)?.focus.path
  const returned =
    isFullscreen && path && isKeySegment(path[0]) ? (
      <ChangeIndicatorWithProvidedFullPath
        className={styles.changeIndicator}
        compareDeep
        value={block}
        hasFocus={path ? path[0]._key === block._key : false}
        path={[{_key: block._key}]}
      >
        {content}
      </ChangeIndicatorWithProvidedFullPath>
    ) : (
      content
    )
  return (
    <div
      className={classNames([
        styles.root,
        isFullscreen && styles.hasFullScreen,
        errors.length > 0 && styles.withError,
        warnings.length > 0 && !errors.length && styles.withWarning
      ])}
    >
      {returned}
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
