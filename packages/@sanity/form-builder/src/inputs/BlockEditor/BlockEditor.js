// @flow
import type {Element as ReactElement} from 'react'
import React from 'react'
import {isKeyHotkey} from 'is-hotkey'

import {PatchEvent} from 'part:@sanity/form-builder/patch-event'

import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import {Portal} from 'part:@sanity/components/utilities/portal'
import Stacked from 'part:@sanity/components/utilities/stacked'
import Escapable from 'part:@sanity/components/utilities/escapable'

import Button from 'part:@sanity/components/buttons/default'
import Spinner from 'part:@sanity/components/loading/spinner'

import EditNode from './EditNode'
import Editor from './Editor'
import Toolbar from './Toolbar/Toolbar'

import styles from './styles/BlockEditor.css'
import IS_MAC from './utils/isMac'

import type {
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  Path,
  SlateChange,
  SlateValue,
  Type
} from './typeDefs'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editor: ReactElement<typeof Editor>,
  editorValue: SlateValue,
  fullscreen: boolean,
  isActive: boolean,
  focusPath: Path,
  markers: Marker[],
  onPatch: (event: PatchEvent) => void,
  isLoading: boolean,
  onChange: (change: SlateChange, callback?: (SlateChange) => void) => void,
  onBlur: Path => void,
  onFocus: Path => void,
  onToggleFullScreen: void => void,
  readOnly?: boolean,
  setFocus: void => void,
  type: Type,
  value: ?(FormBuilderValue[])
}

type State = {
  preventScroll: boolean,
  toolbarStyle: any
}

function findEditNode(focusPath: Path, editorValue) {
  const focusBlockKey = focusPath[0]._key
  const focusInlineKey =
    focusPath[1] && focusPath[1] === 'children' && focusPath[2] && focusPath[2]._key
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

export default class BlockEditor extends React.PureComponent<Props, State> {
  state = {
    preventScroll: false,
    toolbarStyle: {}
  }

  static defaultProps = {
    readOnly: false
  }
  _scrollContainer: ?HTMLElement = null
  _rootElement: ?HTMLElement = null
  _editorWrapper: ?HTMLElement = null

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

  componentDidUpdate() {
    this.checkScrollHeight()
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
      type = blockContentFeatures.annotations.find(an => an.value === focusedAnnotationName)
      if (type) {
        return this.renderEditNode(value, type.type, [focusPath[0], 'markDefs', {_key: value._key}])
      }
    }
    value = slateNode.data.get('value')
    const findType = obj => obj.name === value._type
    if (slateNode.object === 'inline') {
      type = blockContentFeatures.types.inlineObjects.find(findType)
      if (type) {
        return this.renderEditNode(value, type, [focusPath[0], 'children', {_key: value._key}])
      }
    }
    type = blockContentFeatures.types.blockObjects.find(findType)
    if (type) {
      return this.renderEditNode(value, type, [{_key: value._key}])
    }
    return null
  }

  renderEditNode(nodeValue: any, type: Type, path: Path) {
    const {focusPath, readOnly, onBlur, onFocus, onPatch, markers, value} = this.props
    return (
      <EditNode
        focusPath={focusPath}
        markers={markers}
        onBlur={onBlur}
        onPatch={onPatch}
        onFocus={onFocus}
        path={path}
        type={type}
        readOnly={readOnly}
        nodeValue={nodeValue}
        value={value}
      />
    )
  }

  setScrollContainer = (element: ?HTMLDivElement) => {
    this._scrollContainer = element
  }

  setEditorWrapper = (element: ?HTMLDivElement) => {
    this._editorWrapper = element
  }

  setRootElement = (element: ?HTMLDivElement) => {
    this._rootElement = element
  }

  checkScrollHeight = () => {
    if (this._scrollContainer && this._editorWrapper) {
      const preventScroll = this._scrollContainer.offsetHeight < this._editorWrapper.offsetHeight
      if (this.state.preventScroll !== preventScroll) {
        this.setState({
          preventScroll
        })
      }
    }
  }

  handleScroll = (event: Event) => {
    if (!this.props.fullscreen) {
      this.setState({
        toolbarStyle: {}
      })
    }
    if (event.currentTarget instanceof HTMLDivElement) {
      const threshold = 100
      const scrollTop = event.currentTarget.scrollTop
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
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const isFullscreenKey = isKeyHotkey('mod+enter')
    const {onToggleFullScreen} = this.props
    if (isFullscreenKey(event)) {
      event.preventDefault()
      event.stopPropagation()
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
      isLoading,
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
        {isLoading && (
          <div className={styles.loading}>
            <Spinner center />
          </div>
        )}

        <ActivateOnFocus
          isActive={!this.state.preventScroll || fullscreen || isActive}
          html={
            <div className={styles.activeOnFocus}>
              <h3>Click to edit</h3>
              <div>or</div>
              <div>
                <Button onClick={onToggleFullScreen} color="primary">
                  Open in fullscreen
                </Button>
              </div>
              <p className={styles.keyboardShortcut}>
                Tip: <br />
                <strong>{IS_MAC ? '⌘' : 'ctrl'}&nbsp;+&nbsp;enter</strong> while editing to go in
                fullscreen
              </p>
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
    const {focusPath, fullscreen, onToggleFullScreen} = this.props
    const isEditingNode = (focusPath || []).length > 1
    const isFocused = (focusPath || []).length
    return (
      <div className={styles.root} ref={this.setRootElement}>
        {fullscreen && (
          <Stacked>
            {isActive => {
              return (
                <Portal>
                  {isActive && <Escapable onEscape={onToggleFullScreen} />}
                  <div className={styles.fullscreen}>{this.renderEditor()}</div>
                </Portal>
              )
            }}
          </Stacked>
        )}
        {!fullscreen && <div className={isFocused ? styles.focus : ''}>{this.renderEditor()}</div>}
        {isEditingNode && this.renderNodeEditor()}
      </div>
    )
  }
}
