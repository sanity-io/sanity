// @flow

import React, {Fragment} from 'react'
import {findDOMNode} from 'slate-react'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import PatchEvent from '../../../PatchEvent'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'

import type {
  Marker,
  Path,
  FormBuilderValue,
  SlateEditor,
  RenderBlockActions,
  RenderCustomMarkers
} from './typeDefs'

type Props = {
  editor: ?SlateEditor,
  markers: Marker[],
  onFocus: Path => void,
  onPatch: (event: PatchEvent) => void,
  renderBlockActions?: RenderBlockActions,
  renderCustomMarkers?: RenderCustomMarkers,
  userIsWritingText: boolean,
  value: ?(FormBuilderValue[])
}

export default class BlockExtrasFragment extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.userIsWritingText === false) {
      return true
    }
    return false
  }

  render() {
    const {editor} = this.props
    if (!editor) {
      return null
    }
    return (
      <Fragment>
        {editor.value.document.nodes.map(node => {
          const {onFocus, renderCustomMarkers, renderBlockActions, onPatch} = this.props
          const markers = this.props.markers.filter(
            marker => marker.path[0] && marker.path[0]._key && marker.path[0]._key === node.key
          )
          if (markers.length === 0 && !renderBlockActions) {
            return null
          }
          let element
          try {
            element = findDOMNode(node) // eslint-disable-line react/no-find-dom-node
          } catch (err) {
            return null
          }
          const rect = element.getBoundingClientRect()
          let actions = null
          const value = this.props.value || []
          if (renderBlockActions) {
            const block = value.find(blk => blk._key == node.key)
            const RenderComponent = renderBlockActions
            if (block) {
              actions = (
                <RenderComponent
                  block={node}
                  value={block}
                  set={createBlockActionPatchFn('set', block, onPatch)}
                  unset={createBlockActionPatchFn('unset', block, onPatch)}
                  insert={createBlockActionPatchFn('insert', block, onPatch)}
                />
              )
            }
          }
          if (markers.length === 0 && !actions) {
            return null
          }
          return (
            <div
              key={node.key}
              style={{
                position: 'absolute',
                top: element.scrollTop + element.offsetTop,
                height: rect.height,
                width: rect.width
              }}
            >
              <BlockExtras
                block={node}
                blockActions={actions}
                editor={editor}
                markers={markers}
                onFocus={onFocus}
                renderCustomMarkers={renderCustomMarkers}
              />
            </div>
          )
        })}
      </Fragment>
    )
  }
}
