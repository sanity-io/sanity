import React, {Fragment} from 'react'
import {findDOMNode} from 'slate-react'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import PatchEvent from '../../../PatchEvent'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'
import {
  Marker,
  FormBuilderValue,
  SlateEditor,
  SlateValue,
  SlateNode,
  RenderBlockActions,
  RenderCustomMarkers
} from './typeDefs'
import {Path} from '../../typedefs/path'
import {getKey} from './utils/getKey'
type Props = {
  editor: SlateEditor | null
  editorValue: SlateValue | null
  fullscreen: boolean
  markers: Marker[]
  onFocus: (path: Path) => void
  onPatch: (event: PatchEvent) => void
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  userIsWritingText: boolean
  value: FormBuilderValue[] | null
}

type State = {
  visible: boolean
}
export default class BlockExtrasOverlay extends React.Component<Props, State> {
  _setVisibleTimer: any
  _setVisibleRequest: number
  state = {
    visible: false
  }
  componentDidMount() {
    // Wait for things to get finshed rendered before rendering the aboslute positions
    this._setVisibleTimer = setTimeout(() => {
      this._setVisibleRequest = window.requestAnimationFrame(() => {
        this.setState({visible: true})
        this._setVisibleTimer = setTimeout(() => {
          this.setState({visible: true})
        }, 200)
      })
    }, 0)
  }
  componentWillUnmount() {
    clearTimeout(this._setVisibleTimer)
    window.cancelAnimationFrame(this._setVisibleRequest)
  }
  // Don't update this while user is writing
  shouldComponentUpdate(nextProps: Props) {
    return !nextProps.userIsWritingText
  }

  // eslint-disable-next-line complexity
  renderBlockExtras = (node: SlateNode) => {
    const {
      onFocus,
      renderCustomMarkers,
      renderBlockActions,
      onPatch,
      fullscreen,
      editor
    } = this.props
    const markers = this.props.markers.filter(
      marker => marker.path[0] && getKey(marker.path[0]) && getKey(marker.path[0]) === node.key
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
            block={block}
            value={value}
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
    const {editorValue} = this.props
    if (!visible || !editorValue) {
      return null
    }
    return <Fragment>{editorValue.document.nodes.map(this.renderBlockExtras)}</Fragment>
  }
}
