import React, {RefObject} from 'react'
import {debounce} from 'lodash'
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
import {
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  RenderBlockActions,
  RenderCustomMarkers,
  SlateEditor,
  SlateNode,
  SlateValue,
  Type,
  UndoRedoStack
} from './typeDefs'

import {PatchEvent} from '../../PatchEvent'
import {Path} from '../../typedefs/path'
import {getKey} from './utils/getKey'

type Props = {
  blockContentFeatures: BlockContentFeatures
  editorValue: SlateValue
  fullscreen: boolean
  isActive: boolean
  focusPath: Path
  markers: Marker[]
  onPatch: (event: PatchEvent) => void
  isLoading: boolean
  onChange: (editor: SlateEditor, callback?: (arg0: void) => void) => void
  onBlur: () => void
  onFocus: (arg0: Path) => void
  onLoading: (props: {}) => void
  onPaste?: (arg0: {
    event: React.SyntheticEvent
    path: []
    type: Type
    value: FormBuilderValue[] | null
  }) => {
    insert?: FormBuilderValue[]
    path?: []
  }
  onToggleFullScreen: (event: React.SyntheticEvent<any>) => void
  readOnly?: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  setFocus: (arg0: void) => void
  type: Type
  value: FormBuilderValue[] | null
  undoRedoStack: UndoRedoStack
  userIsWritingText: boolean
}

// eslint-disable-next-line complexity
function findEditNode(focusPath: Path, editorValue: SlateValue, editor: SlateEditor) {
  const focusBlockKey = getKey(focusPath[0])
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
    getKey(focusPath[2])
  const markDefKey =
    !isVoidRootBlock && focusPath[2] && focusPath[1] === 'markDefs' && getKey(focusPath[2])
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

type State = {
  preventScroll: boolean
  isDragging: boolean
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
  scrollContainer: RefObject<HTMLDivElement> = React.createRef()
  editor: RefObject<Editor> = React.createRef()
  editorWrapper: RefObject<HTMLDivElement> = React.createRef()

  componentDidMount() {
    this.forceUpdate() // Needed to resolve the refs properly
  }

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
        key => annotations[key]._key === getKey(focusPath[2])
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
    const {focusPath, fullscreen, markers, onFocus, onPatch, readOnly, value} = this.props
    return (
      <EditNode
        editor={this.getEditor()}
        focusPath={focusPath}
        fullscreen={fullscreen}
        markers={markers}
        nodeValue={nodeValue}
        node={slateNode}
        onFocus={onFocus}
        onPatch={onPatch}
        path={path}
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

  handleOnDragEnter = (event: React.DragEvent) => {
    this.setState({isDragging: true})
  }
  handleOnDragLeave = debounce((event: React.DragEvent) => {
    this.setState({isDragging: false})
  }, 1500)

  renderEditor() {
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
    const hasMarkers = markers.filter(marker => marker.path.length > 0).length > 0
    const isEditingNode = (focusPath || []).length > 1
    const scrollContainerClassNames = [
      styles.scrollContainer,
      renderBlockActions || hasMarkers ? styles.hasBlockExtras : null
    ]

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
          <div className={scrollContainerClassNames.join(' ')} ref={this.scrollContainer}>
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

  handleToggleFullscreen = (event: React.SyntheticEvent<any>) => {
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
