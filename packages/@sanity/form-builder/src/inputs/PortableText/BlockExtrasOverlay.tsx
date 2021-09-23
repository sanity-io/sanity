// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useMemo} from 'react'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import {isKeySegment, Marker, Path} from '@sanity/types'
import {
  PortableTextBlock,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import PatchEvent from '../../../PatchEvent'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'
import {RenderBlockActions, RenderCustomMarkers} from './types'

import styles from './BlockExtrasOverlay.module.css'

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
  markers.filter((marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === block._key)

export default function BlockExtrasOverlay(props: Props) {
  const {value} = props

  // Render overlay for each block
  return (
    <div className={styles.root}>
      {(value || []).map((blk) => (
        <BlockExtrasWithBlockActionsAndHeight
          {...props}
          block={blk}
          key={`blockExtras-${blk._key}`}
        />
      ))}
    </div>
  )
}

type BlockExtrasWithBlockActionsAndHeightProps = {
  block: PortableTextBlock
  isFullscreen: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  value: PortableTextBlock[] | undefined
}

function BlockExtrasWithBlockActionsAndHeight(
  props: BlockExtrasWithBlockActionsAndHeightProps
): JSX.Element {
  const {
    block,
    isFullscreen,
    markers,
    onChange,
    onFocus,
    renderBlockActions,
    renderCustomMarkers,
    value,
  } = props
  const editor = usePortableTextEditor()
  const blockMarkers = useMemo(() => findBlockMarkers(block, markers), [block, markers])
  const allowedDecorators = useMemo(
    () => PortableTextEditor.getPortableTextFeatures(editor).decorators.map((dec) => dec.value),
    [editor]
  )
  // eslint-disable-next-line react/no-find-dom-node
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
          set={createBlockActionPatchFn('set', block, onChange, allowedDecorators)}
          unset={
            createBlockActionPatchFn('unset', block, onChange, allowedDecorators) as () => void
          }
          insert={createBlockActionPatchFn('insert', block, onChange, allowedDecorators)}
        />
      )
    }
  }
  const top = element.scrollTop + element.offsetTop
  const height = rect.height
  return (
    <div
      key={`blockExtras-${block._key}`}
      className={styles.block}
      style={{height: `${height}px`, top: `${top}px`}}
    >
      <BlockExtras
        block={block}
        height={height}
        isFullscreen={isFullscreen}
        blockActions={actions}
        markers={blockMarkers}
        onFocus={onFocus}
        renderCustomMarkers={renderCustomMarkers}
        value={value}
      />
    </div>
  )
}
