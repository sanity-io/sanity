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
  SlateValue,
  SlateNode,
  RenderBlockActions,
  RenderCustomMarkers
} from './typeDefs'

type Props = {
  editor: ?SlateEditor,
  editorValue: ?SlateValue,
  fullscreen: boolean,
  markers: Marker[],
  onFocus: Path => void,
  onPatch: (event: PatchEvent) => void,
  renderBlockActions?: RenderBlockActions,
  renderCustomMarkers?: RenderCustomMarkers,
  userIsWritingText: boolean,
  value: ?(FormBuilderValue[])
}

type State = {
  windowWidth: ?Number,
  visible: boolean
}

export default class BlockExtrasFragment extends React.Component<Props, State> {
  state = {
    windowWidth: undefined, // eslint-disable-line react/no-unused-state
    visible: false
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    // Wait for things to get finshed rendered before rendering the aboslute positions
    setTimeout(
      () =>
        window.requestAnimationFrame(() => {
          this.setState({visible: true})
        }),
      0
    )

    setTimeout(() => {
      this.setState({visible: true})
    }, 200)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  // Don't update this while user is writing
  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.userIsWritingText === true) {
      return false
    }
    return true
  }

  handleResize = () => {
    this.setState({
      windowWidth: window.innerWidth // eslint-disable-line react/no-unused-state
    })
  }

  // eslint-disable-next-line complexity
  renderBlockExtras = (node: SlateNode) => {
    const {onFocus, renderCustomMarkers, renderBlockActions, onPatch, fullscreen, editor} = this.props
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
          width: '100%',
          height: rect.height,
          left: 0
        }}
      >
        <BlockExtras
          block={node}
          fullscreen={fullscreen}
          blockActions={actions}
          editor={editor && editor.current}
          markers={markers}
          onFocus={onFocus}
          renderCustomMarkers={renderCustomMarkers}
        />
      </div>
    )
  }

  render() {
    const {visible} = this.state
    if (!visible) {
      return null
    }
    const {editorValue} = this.props
    if (!editorValue) {
      return null
    }
    return <Fragment>{editorValue.document.nodes.map(this.renderBlockExtras)}</Fragment>
  }
}
