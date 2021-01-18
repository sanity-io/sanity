import {useZIndex} from '@sanity/base/components'
import {Layer} from '@sanity/ui'
import React from 'react'
import classNames from 'classnames'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/lib/change-indicators'
import {isKeySegment, Marker, Path} from '@sanity/types'
import {
  PortableTextBlock,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {Markers} from '../../../legacyParts'
import {RenderCustomMarkers} from './types'
import styles from './BlockExtras.css'

type Props = {
  block: PortableTextBlock
  blockActions?: Node
  height: number
  isFullscreen: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  renderCustomMarkers?: RenderCustomMarkers
}
export default function BlockExtras(props: Props) {
  const editor = usePortableTextEditor()
  const zindex = useZIndex()
  const {block, blockActions, height, isFullscreen, markers, onFocus, renderCustomMarkers} = props
  const blockValidation = getValidationMarkers(markers)
  const errors = blockValidation.filter((mrkr) => mrkr.level === 'error')
  const warnings = blockValidation.filter((mrkr) => mrkr.level === 'warning')
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
  const hasFocus = path && isKeySegment(path[0]) ? path[0]._key === block._key : false
  const returned =
    isFullscreen && path && isKeySegment(path[0]) ? (
      <ChangeIndicatorWithProvidedFullPath
        className={styles.changeIndicator}
        compareDeep
        value={block}
        hasFocus={hasFocus}
        path={[{_key: block._key}]}
      >
        {content}
      </ChangeIndicatorWithProvidedFullPath>
    ) : (
      content
    )
  return (
    <Layer
      className={classNames([
        styles.root,
        hasFocus && styles.hasFocus,
        isFullscreen && styles.hasFullScreen,
        errors.length > 0 && styles.withError,
        warnings.length > 0 && !errors.length && styles.withWarning,
      ])}
      zOffset={zindex.portal}
    >
      {returned}
    </Layer>
  )
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
