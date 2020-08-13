import React, {useMemo} from 'react'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import {
  PortableTextBlock,
  PortableTextEditor,
  usePortableTextEditor
} from '@sanity/portable-text-editor'
import PatchEvent from '../../../PatchEvent'
import {Path} from '../../typedefs/path'
import {Marker} from '../../typedefs'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'
import {RenderBlockActions, RenderCustomMarkers} from './types'

import styles from './BlockExtrasOverlay.css'

type Props = {
  isFullscreen: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  value: PortableTextBlock[] | undefined
}

const findBlockMarkers = (block: PortableTextBlock, markers: Marker[]): Marker[] =>
  markers.filter(marker => typeof marker.path[0] === 'object' && marker.path[0]._key === block._key)

export default function BlockExtrasOverlay(props: Props) {
  const {
    onFocus,
    renderCustomMarkers,
    renderBlockActions,
    onChange,
    isFullscreen,
    markers,
    value
  } = props

  const editor = usePortableTextEditor()
  const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)

  function renderBlockExtras(block: PortableTextBlock): JSX.Element {
    const blockMarkers = findBlockMarkers(block, markers)

    // Return if no markers
    if (blockMarkers.length === 0 && !renderBlockActions) {
      return null
    }

    // Try to find DOMNode and return if not
    const element = PortableTextEditor.findDOMNode(editor, block) as HTMLElement
    if (!element) {
      return null
    }

    const rect = element.getBoundingClientRect()
    let actions = null
    if (renderBlockActions) {
      const RenderComponent = renderBlockActions
      if (block) {
        actions = (
          <RenderComponent
            block={block}
            value={value}
            set={createBlockActionPatchFn('set', block, onChange, ptFeatures)}
            unset={createBlockActionPatchFn('unset', block, onChange, ptFeatures) as () => void}
            insert={createBlockActionPatchFn('insert', block, onChange, ptFeatures)}
          />
        )
      }
    }

    if (blockMarkers.length === 0 && !actions) {
      return null
    }

    return (
      <div
        key={`blockExtras-${block._key}`}
        className={styles.root}
        style={{
          top: element.scrollTop + element.offsetTop,
          height: rect.height
        }}
      >
        <BlockExtras
          block={block}
          isFullscreen={isFullscreen}
          blockActions={actions}
          markers={markers}
          onFocus={onFocus}
          renderCustomMarkers={renderCustomMarkers}
        />
      </div>
    )
  }

  // Render overlay for each block
  return <>{(value || []).map(renderBlockExtras)}</>
}
