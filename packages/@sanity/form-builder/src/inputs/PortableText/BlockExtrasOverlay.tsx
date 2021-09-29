// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />
import React, {CSSProperties, useEffect, useMemo, useState} from 'react'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/change-indicators'
import {isKeySegment, Marker, Path} from '@sanity/types'
import {
  PortableTextBlock,
  PortableTextEditor,
  RenderAttributes,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import PatchEvent from '../../../PatchEvent'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'

const baseStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  userSelect: 'none',
  width: '100%',
  height: 'auto',
}

const findBlockMarkers = (block: PortableTextBlock, markers: Marker[]): Marker[] =>
  markers.filter((marker) => isKeySegment(marker.path[0]) && marker.path[0]._key === block._key)

type Props = {
  attributes: RenderAttributes
  block: PortableTextBlock
  blockRef: React.RefObject<HTMLDivElement>
  isFullscreen?: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  value: PortableTextBlock[] | undefined
}

export function BlockExtrasWithChangeIndicator(props: Props): JSX.Element {
  const {
    attributes,
    block,
    blockRef,
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
  const path = useMemo(() => [{_key: block._key}], [block._key])
  const hasFocus = attributes.focused

  const [rootStyle, setRootStyle] = useState(baseStyle)
  useEffect(() => {
    if (blockRef.current) {
      const element = blockRef.current
      const top = element ? element.scrollTop + element.offsetTop : undefined
      const rect = element.getBoundingClientRect()
      const height = rect?.height
      setRootStyle({...baseStyle, height, top})
    }
  }, [blockRef])
  const actions = useMemo(() => {
    if (renderBlockActions) {
      const RenderComponent = renderBlockActions
      if (block) {
        return (
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
    return null
  }, [allowedDecorators, block, onChange, renderBlockActions, value])
  const withoutChangeIndicators = useMemo(
    () => (
      <BlockExtras
        attributes={attributes}
        blockActions={actions}
        markers={blockMarkers}
        onFocus={onFocus}
        renderCustomMarkers={renderCustomMarkers}
      />
    ),
    [actions, attributes, blockMarkers, onFocus, renderCustomMarkers]
  )
  const heightRule = useMemo(() => ({height: rootStyle.height}), [rootStyle.height])
  const withChangeIndicators = useMemo(
    () =>
      isFullscreen && (
        <ChangeIndicatorWithProvidedFullPath
          compareDeep
          value={block}
          hasFocus={hasFocus}
          path={path}
        >
          <div style={heightRule}>{withoutChangeIndicators}</div>
        </ChangeIndicatorWithProvidedFullPath>
      ),
    [isFullscreen, block, hasFocus, path, heightRule, withoutChangeIndicators]
  )
  return (
    <div style={rootStyle} contentEditable={false}>
      {withChangeIndicators || withoutChangeIndicators}
    </div>
  )
}
