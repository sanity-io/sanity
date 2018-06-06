// @flow
import type {Element as ReactElement} from 'react'
import React from 'react'
import {isKeyHotkey} from 'is-hotkey'

import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import {Portal} from 'part:@sanity/components/utilities/portal'
import StackedEscapable from 'part:@sanity/components/utilities/stacked-escapable'
import Button from 'part:@sanity/components/buttons/default'

import EditNode from './EditNode'
import Editor from './Editor'
import Toolbar from './Toolbar/Toolbar'

import styles from './styles/BlockEditor.css'
import IS_MAC from './utils/isMac'

import type {BlockContentFeatures, SlateChange, SlateValue, Marker, Type} from './typeDefs'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editor: ReactElement<typeof Editor>,
  editorValue: SlateValue,
  fullscreen: boolean,
  isActive: boolean,
  focusPath: [],
  markers: Marker[],
  onPatch: (event: PatchEvent) => void,
  onChange: (change: SlateChange) => void,
  onBlur: (nextPath: []) => void,
  onFocus: (nextPath: []) => void,
  onToggleFullScreen: void => void,
  readOnly?: boolean,
  setFocus: void => void,
  type: Type,
  value: Block[]
}

function findEditNode(focusPath, editorValue) {
  const focusBlockKey = focusPath[0]._key
  const focusInlineKey = focusPath[2] && focusPath[1] !== 'markDefs' && focusPath[2]._key
  const markDefKey = focusPath[2] && focusPath[1] === 'markDefs' && focusPath[2]._key
  let key
  if (markDefKey) {
    const block = editorValue.document.getDescendant(focusBlockKey)
    if (!block) {
      return null
    }
    const span = block.filterDescendants(desc => desc.type === 'span').find(node => {
      const annotations = node.data.get('annotations') || {}
      return Object.keys(annotations).find(
        aKey => annotations[aKey] && annotations[aKey]._key === markDefKey
      )
    })
    return span
  } else if (focusInlineKey) {
    key = focusInlineKey
  } else {
    key = focusBlockKey
  }
  return editorValue.document.getDescendant(key)
}

export default class BlockEditor extends React.PureComponent<Props> {
  state = {
    preventScroll: false,
    toolbarStyle: {}
  }

  componentDidMount() {
    this.checkScrollHeight()

    if (this._rootElement) {
      this._rootElement.addEventListener('keydown', this.handleKeyDown, false)
    }

    if (this._scrollContainer) {
      this._scrollContainer.addEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  componentWillUnmount() {
    if (this._rootElement) {
      this._rootElement.removeEventListener('keydown', this.handleKeyDown, false)
    }
    if (this._scrollContainer) {
      this._scrollContainer.removeEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps !== this.props) {
      this.checkScrollHeight()
    }
  }

  renderNodeEditor() {
    const {blockContentFeatures, editorValue, focusPath} = this.props
    const slateNode = findEditNode(focusPath, editorValue)
    if (!slateNode || slateNode.type === 'contentBlock') {
      return null
    }
    let value
    let type
    if (slateNode.type === 'span') {
      const annotations = slateNode.data.get('annotations')
      const focusedAnnotationName = Object.keys(annotations).find(
        key => annotations[key]._key === focusPath[2]._key
      )
      if (!focusedAnnotationName) {
        return null
      }
      value = annotations[focusedAnnotationName]
      type = blockContentFeatures.annotations.find(an => an.value === focusedAnnotationName).type
      return this.renderEditNode(value, type, [focusPath[0], 'markDefs', {_key: value._key}])
    }
    value = slateNode.data.get('value')
    const findType = obj => obj.name === value._type
    if (slateNode.object === 'inline') {
      type = blockContentFeatures.types.inlineObjects.find(findType)
      return this.renderEditNode(value, type, [focusPath[0], 'children', {_key: value._key}])
    }
    type = blockContentFeatures.types.blockObjects.find(findType)
    return this.renderEditNode(value, type, [{_key: value._key}])
  }

  renderEditNode(nodeValue, type, path) {
    const {focusPath, onBlur, onFocus, onPatch, markers, value} = this.props
    return (
      <EditNode
        focusPath={focusPath}
        markers={markers}
        onBlur={onBlur}
        onPatch={onPatch}
        onFocus={onFocus}
        path={path}
        type={type}
        nodeValue={nodeValue}
        value={value}
      />
    )
  }

  setScrollContainer = element => {
    this._scrollContainer = element
  }

  setEditorWrapper = element => {
    this._editorWrapper = element
  }

  setRootElement = element => {
    this._rootElement = element
  }

  checkScrollHeight = () => {
    if (this._scrollContainer && this._editorWrapper) {
      this.setState({
        preventScroll: this._scrollContainer.offsetHeight < this._editorWrapper.offsetHeight
      })
    }
  }

  handleScroll = event => {
    if (!this.props.fullscreen) {
      this.setState({
        toolbarStyle: {}
      })
    }
    const threshold = 100
    const scrollTop = event.target.scrollTop
    let ratio = scrollTop / threshold
    if (ratio >= 1) {
      ratio = 1
    }
    this.setState({
      toolbarStyle: {
        backgroundColor: `rgba(255, 255, 255, ${ratio * 0.95})`,
        boxShadow: `0 2px ${5 * ratio}px rgba(0, 0, 0, ${ratio * 0.3})`
      }
    })
  }

  handleKeyDown = (event: SyntheticKeyboardEvent<*>) => {
    const isFullscreenKey = isKeyHotkey('mod+enter')
    const {onToggleFullScreen} = this.props
    if (isFullscreenKey(event)) {
      onToggleFullScreen()
    }
  }

  renderEditor() {
    const {
      isActive,
      blockContentFeatures,
      editorValue,
      editor,
      focusPath,
      fullscreen,
      onChange,
      onFocus,
      onToggleFullScreen,
      readOnly,
      setFocus,
      type,
      markers
    } = this.props
    if (readOnly) {
      return <div>{editor}</div>
    }
    return (
      <div>
        <div className={styles.toolbar}>
          <Toolbar
            blockContentFeatures={blockContentFeatures}
            editorValue={editorValue}
            fullscreen={fullscreen}
            focusPath={focusPath}
            onChange={onChange}
            onFocus={onFocus}
            onToggleFullScreen={onToggleFullScreen}
            style={fullscreen ? this.state.toolbarStyle : {}}
            markers={markers}
            type={type}
          />
        </div>
        <ActivateOnFocus
          isActive={!this.state.preventScroll || fullscreen || isActive}
          html={
            <div className={styles.activeOnFocus}>
              <h3>Click to scroll</h3>
              <div>or</div>
              <Button inverted onClick={onToggleFullScreen}>
                Open in fullscreen ({IS_MAC ? 'cmd' : 'ctrl'}+enter)
              </Button>
            </div>
          }
          onActivate={setFocus}
        >
          <div
            className={styles.scrollContainer}
            ref={this.setScrollContainer}
            onScroll={this.handleScroll}
          >
            <div className={styles.editorWrapper} ref={this.setEditorWrapper}>
              {editor}
            </div>
          </div>
        </ActivateOnFocus>
      </div>
    )
  }

  render() {
    const {focusPath, fullscreen, readOnly, onToggleFullScreen} = this.props
    const isEditingNode = !readOnly && (focusPath || []).length > 1
    const isFocused = (focusPath || []).length
    return (
      <div className={styles.root} ref={this.setRootElement}>
        {fullscreen && (
          <StackedEscapable onEscape={onToggleFullScreen}>
            <Portal>
              <div className={styles.fullscreen}>{this.renderEditor()}</div>
            </Portal>
          </StackedEscapable>
        )}
        {!fullscreen && <div className={isFocused ? styles.focus : ''}>{this.renderEditor()}</div>}
        {isEditingNode && this.renderNodeEditor()}
      </div>
    )
  }
}
