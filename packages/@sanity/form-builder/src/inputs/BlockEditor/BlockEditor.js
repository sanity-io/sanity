// @flow
import type {Element as ReactElement, ElementRef} from 'react'
import React from 'react'
import {debounce} from 'lodash'

import {PatchEvent} from 'part:@sanity/form-builder/patch-event'

import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import {Portal} from 'part:@sanity/components/utilities/portal'
import StackedEscapeable from 'part:@sanity/components/utilities/stacked-escapable'

import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
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
  SlateEditor,
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
  onChange: (editor: SlateEditor, callback?: (void) => void) => void,
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
  isDragging: boolean
}

// eslint-disable-next-line complexity
function findEditNode(focusPath: Path, editorValue: SlateValue, editor: SlateEditor) {
  const focusBlockKey = focusPath[0] && focusPath[0]._key
  const isVoidRootBlock =
    focusBlockKey &&
    editorValue &&
    editorValue.document &&
    editorValue.document.size > 0 &&
    editor.query('isVoid', editorValue.document.getDescendant(focusBlockKey))
  const focusInlineKey =
    !isVoidRootBlock &&
    focusPath[1] &&
    focusPath[1] === 'children' &&
    focusPath[2] &&
    focusPath[2]._key
  const markDefKey =
    !isVoidRootBlock && focusPath[2] && focusPath[1] === 'markDefs' && focusPath[2]._key
  let key
  if (markDefKey) {
    const block = editorValue.document.getDescendant(focusBlockKey)
    if (!block) {
      return null
    }
    const span = block
      .filterDescendants(desc => desc.type === 'span')
      .find(node => {
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
    isDragging: false
  }

  static defaultProps = {
    readOnly: false,
    onPaste: undefined,
    renderBlockActions: undefined,
    renderCustomMarkers: undefined
  }
  scrollContainer: ElementRef<any> = React.createRef()
  editor: ElementRef<any> = React.createRef()
  editorWrapper: ElementRef<any> = React.createRef()

  componentDidUpdate() {
    this.checkScrollHeight()
  }

  componentWillUnmount() {
    this.handleOnDragLeave.cancel()
  }

  renderNodeEditor() {
    const {blockContentFeatures, editorValue, focusPath} = this.props
    const slateNode = findEditNode(focusPath, editorValue, this.getEditor())
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
    const {
      focusPath,
      fullscreen,
      markers,
      onBlur,
      onFocus,
      onPatch,
      readOnly,
      setFocus,
      value
    } = this.props
    return (
      <EditNode
        editor={this.getEditor()}
        focusPath={focusPath}
        fullscreen={fullscreen}
        markers={markers}
        nodeValue={nodeValue}
        node={slateNode}
        onBlur={onBlur}
        onFocus={onFocus}
        onPatch={onPatch}
        path={path}
        setFocus={setFocus}
        readOnly={readOnly}
        type={type}
        value={value}
      />
    )
  }

  checkScrollHeight = () => {
    if (this.scrollContainer && this.scrollContainer.current && this.editorWrapper.current) {
      const preventScroll =
        this.scrollContainer.current.offsetHeight < this.editorWrapper.current.offsetHeight
      if (this.state.preventScroll !== preventScroll) {
        this.setState({
          preventScroll
        })
      }
    }
  }

  getEditor() {
    if (this.editor && this.editor.current) {
      return this.editor.current.getEditor()
    }
    return null
  }

  handleOnDragEnter = (event: SyntheticDragEvent<>) => {
    this.setState({isDragging: true})
  }

  handleOnDragLeave = debounce((event: SyntheticDragEvent<>) => {
    this.setState({isDragging: false})
  }, 1500)

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
      userIsWritingText,
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
        ref={this.editor}
        renderBlockActions={renderBlockActions}
        renderCustomMarkers={renderCustomMarkers}
        scrollContainer={this.scrollContainer}
        setFocus={setFocus}
        type={type}
        undoRedoStack={undoRedoStack}
        userIsWritingText={userIsWritingText}
        value={value}
      />
    )
  }

  renderReadOnlyFullscreenButton() {
    const {readOnly, fullscreen} = this.props
    if (!readOnly) {
      return null
    }
    return (
      <div className={styles.readOnlyFullscreenButtonContainer}>
        <Button
          kind="simple"
          onClick={this.handleToggleFullscreen}
          title={`Open in fullscreen`}
          icon={fullscreen ? CloseIcon : FullscreenIcon}
        />
      </div>
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
      setFocus,
      readOnly,
      renderBlockActions,
      type,
      userIsWritingText
    } = this.props

    const isEditingNode = (focusPath || []).length > 1

    const hasMarkers = markers.filter(marker => marker.path.length > 0).length > 0

    const scrollContainerClassNames = [
      styles.scrollContainer,
      renderBlockActions || hasMarkers ? styles.hasBlockExtras : null
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div>
        {!readOnly && (
          <Toolbar
            blockContentFeatures={blockContentFeatures}
            editor={this.getEditor()}
            editorValue={editorValue}
            fullscreen={fullscreen}
            markers={markers}
            onFocus={onFocus}
            onToggleFullScreen={this.handleToggleFullscreen}
            isDragging={this.state.isDragging}
            type={type}
            userIsWritingText={userIsWritingText}
          />
        )}

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
          <div className={scrollContainerClassNames} ref={this.scrollContainer}>
            <div className={styles.editorWrapper} ref={this.editorWrapper}>
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
    const {focusPath, fullscreen, readOnly} = this.props
    const isFocused = (focusPath || []).length
    return (
      <div className={styles.root}>
        {fullscreen && (
          <Portal>
            <StackedEscapeable onEscape={this.handleToggleFullscreen}>
              <div
                className={styles.fullscreen}
                onDragLeave={this.handleOnDragLeave}
                onDragEnter={this.handleOnDragEnter}
              >
                {this.renderReadOnlyFullscreenButton()}
                {this.renderBlockEditor()}
              </div>
            </StackedEscapeable>
          </Portal>
        )}
        {!fullscreen && (
          <div className={isFocused && !readOnly ? styles.focus : ''}>
            {this.renderReadOnlyFullscreenButton()}
            {this.renderBlockEditor()}
          </div>
        )}
      </div>
    )
  }
}
