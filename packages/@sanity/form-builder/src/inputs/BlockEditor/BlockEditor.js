// @flow
import type {Element as ReactElement, ElementRef} from 'react'
import React from 'react'

import {PatchEvent} from 'part:@sanity/form-builder/patch-event'

import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import {Portal} from 'part:@sanity/components/utilities/portal'
import Stacked from 'part:@sanity/components/utilities/stacked'

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
  RenderBlockActions,
  RenderCustomMarkers,
  SlateChange,
  SlateNode,
  SlateValue,
  Type,
  UndoRedoStack
} from './typeDefs'

type Props = {
  blockContentFeatures: BlockContentFeatures,
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
  onLoading: (props: {}) => void,
  onPaste?: ({
    event: SyntheticEvent<>,
    path: [],
    type: Type,
    value: ?(FormBuilderValue[])
  }) => {insert?: FormBuilderValue[], path?: []},
  onPatch: (event: PatchEvent) => void,
  onToggleFullScreen: (event: SyntheticEvent<*>) => void,
  readOnly?: boolean,
  renderBlockActions?: RenderBlockActions,
  renderCustomMarkers?: RenderCustomMarkers,
  setFocus: void => void,
  type: Type,
  value: ?(FormBuilderValue[]),
  undoRedoStack: UndoRedoStack,
  userIsWritingText: boolean
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
  _editor: ElementRef<any> = React.createRef()

  componentDidMount() {
    this.checkScrollHeight()
    if (this._scrollContainer) {
      this._scrollContainer.addEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  componentWillUnmount() {
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
        return this.renderEditNode(
          value,
          type.type,
          [focusPath[0], 'markDefs', {_key: value._key}],
          slateNode
        )
      }
    }
    value = slateNode.data.get('value')
    const findType = obj => obj.name === value._type
    if (slateNode.object === 'inline') {
      type = blockContentFeatures.types.inlineObjects.find(findType)
      if (type) {
        return this.renderEditNode(
          value,
          type,
          [focusPath[0], 'children', {_key: value._key}],
          slateNode
        )
      }
    }
    type = blockContentFeatures.types.blockObjects.find(findType)
    if (type) {
      return this.renderEditNode(value, type, [{_key: value._key}], slateNode)
    }
    return null
  }

  renderEditNode(nodeValue: any, type: Type, path: Path, slateNode: SlateNode) {
    const {focusPath, readOnly, onBlur, onFocus, onPatch, markers, value, fullscreen} = this.props
    return (
      <EditNode
        focusPath={focusPath}
        fullscreen={fullscreen}
        markers={markers}
        nodeValue={nodeValue}
        node={slateNode}
        onBlur={onBlur}
        onFocus={onFocus}
        onPatch={onPatch}
        path={path}
        readOnly={readOnly}
        type={type}
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
          backgroundColor: `rgba(255, 255, 255, ${ratio * 1})`,
          boxShadow: `0 2px ${5 * ratio}px rgba(0, 0, 0, ${ratio * 0.3})`
        }
      })
    }
  }

  getEditor() {
    if (this._editor && this._editor.current) {
      return this._editor.current.getEditor()
    }
    return null
  }

  renderEditor(): ReactElement<typeof Editor> {
    const {
      blockContentFeatures,
      editorValue,
      focusPath,
      fullscreen,
      markers,
      onBlur,
      onFocus,
      onChange,
      onLoading,
      onPatch,
      onPaste,
      isLoading,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      setFocus,
      type,
      undoRedoStack,
      value
    } = this.props
    return (
      <Editor
        blockContentFeatures={blockContentFeatures}
        editorValue={editorValue}
        focusPath={focusPath}
        fullscreen={fullscreen}
        isLoading={isLoading}
        markers={markers}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        onLoading={onLoading}
        onPaste={onPaste}
        onPatch={onPatch}
        onToggleFullScreen={this.handleToggleFullscreen}
        readOnly={readOnly}
        ref={this._editor}
        renderBlockActions={renderBlockActions}
        renderCustomMarkers={renderCustomMarkers}
        setFocus={setFocus}
        type={type}
        undoRedoStack={undoRedoStack}
        value={value}
      />
    )
  }

  // eslint-disable-next-line complexity
  renderBlockEditor() {
    const {
      blockContentFeatures,
      editorValue,
      fullscreen,
      focusPath,
      isActive,
      isLoading,
      markers,
      onFocus,
      readOnly,
      setFocus,
      type,
      userIsWritingText
    } = this.props
    const isEditingNode = (focusPath || []).length > 1
    if (readOnly) {
      return this.renderEditor()
    }
    return (
      <div>
        <div className={styles.toolbar}>
          <Toolbar
            blockContentFeatures={blockContentFeatures}
            editor={this.getEditor()}
            editorValue={editorValue}
            fullscreen={fullscreen}
            markers={markers}
            onFocus={onFocus}
            onToggleFullScreen={this.handleToggleFullscreen}
            style={fullscreen ? this.state.toolbarStyle : {}}
            type={type}
            userIsWritingText={userIsWritingText}
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
                <Button onClick={this.handleToggleFullscreen} color="primary">
                  Open in fullscreen
                </Button>
              </div>
              <p className={styles.keyboardShortcut}>
                Tip: <br />
                <strong>
                  {IS_MAC ? '⌘' : 'ctrl'}
                  &nbsp;+&nbsp;enter
                </strong>{' '}
                while editing to go in fullscreen
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
              {this.renderEditor()}
              {isEditingNode && fullscreen && this.renderNodeEditor()}
            </div>
          </div>
        </ActivateOnFocus>
        {isEditingNode && !fullscreen && this.renderNodeEditor()}
      </div>
    )
  }

  handleToggleFullscreen = (event: SyntheticEvent<*>) => {
    const {onToggleFullScreen} = this.props
    onToggleFullScreen(event)
  }

  render() {
    const {focusPath, fullscreen} = this.props
    const isFocused = (focusPath || []).length
    return (
      <div className={styles.root} ref={this.setRootElement}>
        {fullscreen && (
          <Stacked>
            {isActive => {
              return (
                <Portal>
                  <div className={styles.fullscreen}>{this.renderBlockEditor()}</div>
                </Portal>
              )
            }}
          </Stacked>
        )}
        {!fullscreen && (
          <div className={isFocused ? styles.focus : ''}>{this.renderBlockEditor()}</div>
        )}
      </div>
    )
  }
}
