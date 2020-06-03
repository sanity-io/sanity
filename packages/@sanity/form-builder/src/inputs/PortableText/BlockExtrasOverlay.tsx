import React from 'react'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import PatchEvent from '../../../PatchEvent'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import {Path} from '../../typedefs/path'
import {Marker} from '../../typedefs'
import {PortableTextBlock, PortableTextEditor} from '@sanity/portable-text-editor'

import styles from './BlockExtrasOverlay.css'

type Props = {
  isFullscreen: boolean
  editor: PortableTextEditor
  markers: Marker[]
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  value: PortableTextBlock[] | undefined
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
  componentDidMount(): void {
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
  componentWillUnmount(): void {
    clearTimeout(this._setVisibleTimer)
    window.cancelAnimationFrame(this._setVisibleRequest)
  }

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    return (
      nextProps.value !== this.props.value ||
      nextState.visible !== this.state.visible ||
      nextProps.markers !== this.props.markers
    )
  }

  // eslint-disable-next-line complexity
  renderBlockExtras = (block: PortableTextBlock): JSX.Element => {
    const {
      editor,
      onFocus,
      renderCustomMarkers,
      renderBlockActions,
      onChange,
      isFullscreen
    } = this.props
    const markers = this.props.markers.filter(
      marker => typeof marker.path[0] === 'object' && marker.path[0]._key === block._key
    )
    if (markers.length === 0 && !renderBlockActions) {
      return null
    }
    let element
    try {
      element = PortableTextEditor.findDOMNode(editor, block)
    } catch (err) {
      return null
    }
    const rect = element.getBoundingClientRect()
    let actions = null
    const value = this.props.value || []
    if (renderBlockActions) {
      const RenderComponent = renderBlockActions
      const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
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

    if (markers.length === 0 && !actions) {
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

  render(): JSX.Element {
    const {value} = this.props
    const {visible} = this.state
    if (!visible || !value || !Array.isArray(value)) {
      return null
    }
    return <>{value.map(this.renderBlockExtras)}</>
  }
}
