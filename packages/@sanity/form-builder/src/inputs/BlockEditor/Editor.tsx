import React, {RefObject} from 'react'
import ReactDOM from 'react-dom'
import SoftBreakPlugin from 'slate-soft-break'
import {findDOMNode, Editor as SlateReactEditor, getEventTransfer} from 'slate-react'
import {isEqual} from 'lodash'
import {isKeyHotkey} from 'is-hotkey'
import insertBlockOnEnter from 'slate-insert-block-on-enter'
import onPasteFromPart from 'part:@sanity/form-builder/input/block-editor/on-paste?'
import onCopy from 'part:@sanity/form-builder/input/block-editor/on-copy?'
import PatchEvent, {insert, set, setIfMissing} from '../../../PatchEvent'
import {
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  RenderBlockActions,
  RenderCustomMarkers,
  SlateComponentProps,
  SlateEditor,
  SlateMarkProps,
  SlateNode,
  SlateSchema,
  SlateValue,
  Type,
  UndoRedoStack
} from './typeDefs'
import {VALUE_TO_JSON_OPTS} from './utils/createOperationToPatches'
import buildEditorSchema from './utils/buildEditorSchema'
import ExpandToWordPlugin from './plugins/ExpandToWordPlugin'
import EnsurePlaceHolderBlockPlugin from './plugins/EnsurePlaceHolderBlockPlugin'
import InsertBlockObjectPlugin from './plugins/InsertBlockObjectPlugin'
import InsertInlineObjectPlugin from './plugins/InsertInlineObjectPlugin'
import ListItemOnEnterKeyPlugin from './plugins/ListItemOnEnterKeyPlugin'
import ListItemOnTabKeyPlugin from './plugins/ListItemOnTabKeyPlugin'
import OnDropPlugin from './plugins/OnDropPlugin'
import OnFocusPlugin from './plugins/OnFocusPlugin'
import TogglePlaceHolderPlugin from './plugins/TogglePlaceHolderPlugin'
import PastePlugin from './plugins/PastePlugin'
import QueryPlugin from './plugins/QueryPlugin'
import SetBlockStylePlugin from './plugins/SetBlockStylePlugin'
import SetMarksOnKeyComboPlugin from './plugins/SetMarksOnKeyComboPlugin'
import TextBlockOnEnterKeyPlugin from './plugins/TextBlockOnEnterKeyPlugin'
import ToggleAnnotationPlugin from './plugins/ToggleAnnotationPlugin'
import ToggleListItemPlugin from './plugins/ToggleListItemPlugin'
import UndoRedoPlugin from './plugins/UndoRedoPlugin'
import WrapSpanPlugin from './plugins/WrapSpanPlugin'
import FireFoxVoidNodePlugin from './plugins/FirefoxVoidNodePlugin'
import FocusNoScrollPlugin from './plugins/FocusNoScrollPlugin'
import ScrollAbsoluteTopBottomPlugin from './plugins/ScrollAbsoluteTopBottomPlugin'
import ScrollToFocusWithDynamicHeightPreviewPlugin from './plugins/ScrollToFocusWithDynamicHeightPreviewPlugin'
import BlockExtrasOverlay from './BlockExtrasOverlay'
import BlockObject from './nodes/BlockObject'
import ContentBlock from './nodes/ContentBlock'
import Decorator from './nodes/Decorator'
import InlineObject from './nodes/InlineObject'
import Span from './nodes/Span'
import styles from './styles/Editor.css'
import {EDITOR_DEFAULT_BLOCK_TYPE, editorValueToBlocks, normalizeBlock} from '@sanity/block-tools'
import {getKey} from './utils/getKey'
import {Path} from '../../typedefs/path'
type PasteProgressResult = {
  status: string | null
  error?: Error
}
type OnPasteResult =
  | (
      | {
          insert?: FormBuilderValue[]
          path?: []
        }
      | Error)
  | null
type OnPasteResultOrPromise = (OnPasteResult | Promise<OnPasteResult>) | null
type OnPasteFn = (arg0: {
  event: React.SyntheticEvent
  path: []
  type: Type
  value: FormBuilderValue[] | null
}) => OnPasteResultOrPromise
type Props = {
  blockContentFeatures: BlockContentFeatures
  editorValue: SlateValue
  focusPath: Path
  fullscreen: boolean
  markers: Marker[]
  onBlur: (nextPath: []) => void
  onChange: (editor: SlateEditor, callback?: (arg0: void) => void) => void
  onFocus: (arg0: Path) => void
  onLoading: (props: {}) => void
  onPaste?: OnPasteFn
  onPatch: (event: PatchEvent) => void
  onToggleFullScreen: (event: React.SyntheticEvent<any>) => void
  readOnly?: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  scrollContainer: React.RefObject<HTMLDivElement>
  setFocus: (arg0: void) => void
  type: Type
  undoRedoStack: UndoRedoStack
  userIsWritingText: boolean
  value: FormBuilderValue[] | null
}
function scrollIntoView(node: SlateNode, opts: any = {}) {
  const element = findDOMNode(node) // eslint-disable-line react/no-find-dom-node
  element.scrollIntoView({
    behavior: opts.behavior || 'instant',
    block: opts.block || 'center',
    inline: opts.inline || 'nearest'
  })
}
export default class Editor extends React.Component<Props, {}> {
  static defaultProps = {
    readOnly: false,
    onPaste: undefined,
    renderCustomMarkers: undefined,
    renderBlockActions: undefined
  }
  blockDragMarker: HTMLDivElement | null
  editorSchema: SlateSchema
  editor: RefObject<any> = React.createRef()
  plugins = []
  constructor(props: Props) {
    super(props)
    this.editorSchema = buildEditorSchema(props.blockContentFeatures)
    this.plugins = [
      QueryPlugin(),
      ListItemOnEnterKeyPlugin({defaultBlock: EDITOR_DEFAULT_BLOCK_TYPE}),
      ListItemOnTabKeyPlugin(),
      ToggleListItemPlugin(),
      TextBlockOnEnterKeyPlugin({defaultBlock: EDITOR_DEFAULT_BLOCK_TYPE}),
      SetMarksOnKeyComboPlugin({
        decorators: props.blockContentFeatures.decorators.map(item => item.value)
      }),
      SoftBreakPlugin({
        onlyIn: [EDITOR_DEFAULT_BLOCK_TYPE.type],
        shift: true
      }),
      PastePlugin({
        controller: this.editor,
        blockContentType: props.type,
        blockContentFeatures: props.blockContentFeatures,
        onChange: props.onChange,
        onProgress: this.handlePasteProgress
      }),
      insertBlockOnEnter(EDITOR_DEFAULT_BLOCK_TYPE),
      OnDropPlugin(),
      OnFocusPlugin(),
      TogglePlaceHolderPlugin(),
      SetBlockStylePlugin(),
      ToggleAnnotationPlugin(),
      ExpandToWordPlugin(),
      WrapSpanPlugin(),
      InsertInlineObjectPlugin(props.type),
      InsertBlockObjectPlugin(),
      EnsurePlaceHolderBlockPlugin(props.blockContentFeatures),
      UndoRedoPlugin({stack: props.undoRedoStack}),
      FireFoxVoidNodePlugin(),
      FocusNoScrollPlugin(props.scrollContainer),
      ScrollAbsoluteTopBottomPlugin(props.scrollContainer),
      ScrollToFocusWithDynamicHeightPreviewPlugin(props.scrollContainer, scrollIntoView)
    ]
  }
  componentDidMount() {
    this.trackFocusPath()
  }
  componentDidUpdate(prevProps: Props) {
    const editor = this.getEditor()
    if (!editor) {
      return
    }
    // Check if focusPAth has changed from what is currently the focus in the editor
    const {focusPath} = this.props
    if (!focusPath || focusPath.length === 0) {
      return
    }
    const focusPathChanged = !isEqual(prevProps.focusPath, focusPath)
    if (!focusPathChanged) {
      return
    }
    this.trackFocusPath()
  }
  // Select the editor document element according to the focusPath and scroll there
  // (unless it is a single block, then Slate will deal with it)
  // eslint-disable-next-line complexity
  trackFocusPath() {
    const {focusPath, editorValue} = this.props
    const editor = this.getEditor()
    if (!(editor && focusPath && editorValue)) {
      return
    }
    const focusPathIsSingleBlock =
      editorValue.focusBlock && isEqual(focusPath, [{_key: editorValue.focusBlock.key}])
    const firstKey = focusPath[0] && getKey(focusPath[0])
    const block = firstKey && editorValue.document.getDescendant(firstKey)
    const isRootVoidBlock = block && editor.query('isVoid', block)
    let inline
    // Something inside a non-void root block is selected
    if (!focusPathIsSingleBlock && !isRootVoidBlock) {
      // Inline object
      const inlineKey = focusPath[2] && getKey(focusPath[2])
      inline = inlineKey && editorValue.document.getDescendant(inlineKey)
      if (
        inline &&
        focusPath[1] &&
        (focusPath[1] === 'children' || focusPath[1] === 'markDefs') &&
        focusPath[2]
      ) {
        scrollIntoView(inline)
      } // (void) Block
      else if (block) {
        scrollIntoView(block)
      }
    }
    // The rest should be handled by Slate
  }
  // When user changes the selection in the editor, update focusPath accordingly.
  handleChange = (editor: SlateEditor) => {
    const {onChange, onFocus, focusPath} = this.props
    const {focusBlock} = editor.value
    const path = []
    if (focusBlock) {
      path.push({_key: focusBlock.key})
    }
    if (path.length && focusPath && focusPath.length === 1) {
      return onChange(editor, () => onFocus(path))
    }
    return onChange(editor)
  }
  handleEditorFocus = (event: any, editor: SlateEditor, next: (arg0: void) => void) => {
    this.props.setFocus() // Tell the formbuilder to set focus here
    next() // Continue Slate's focus plugin stack
  }
  getValue = () => {
    return this.props.value
  }
  getEditor = () => {
    if (this.editor && this.editor.current) {
      return this.editor.current
    }
    return null
  }
  handlePasteProgress = ({status}: PasteProgressResult) => {
    const {onLoading} = this.props
    onLoading({paste: status})
  }
  handleShowBlockDragMarker = (pos: string, node: HTMLDivElement) => {
    // eslint-disable-next-line react/no-find-dom-node
    const editorDOMNode = ReactDOM.findDOMNode(this.getEditor())
    if (editorDOMNode instanceof HTMLElement) {
      const elemRect = node.getBoundingClientRect()
      const topPos = node.scrollTop + node.offsetTop
      const bottomPos = node.scrollTop + node.offsetTop + elemRect.height
      const top = pos === 'after' ? `${bottomPos}px` : `${topPos}px`
      if (this.blockDragMarker) {
        this.blockDragMarker.style.display = 'block'
        this.blockDragMarker.style.top = top
      }
    }
  }
  handleHideBlockDragMarker = () => {
    if (this.blockDragMarker) {
      this.blockDragMarker.style.display = 'none'
    }
  }
  // Handles user given onPaste function (or return default)
  handlePaste = (
    event: React.SyntheticEvent,
    editor: SlateEditor,
    next: () => void
  ): Promise<any> | void => {
    event.persist() // Keep the event through the plugin chain after calling next()
    const onPaste = this.props.onPaste || onPasteFromPart
    if (!onPaste) {
      return next()
    }
    const {focusPath, onPatch, onLoading, value, type} = this.props
    onLoading({paste: 'start'})
    const resolveOnPasteResultOrError = (): OnPasteResultOrPromise | Error => {
      try {
        return onPaste({event, value, path: focusPath, type})
      } catch (error) {
        return error
      }
    }
    // Resolve it as promise (can be either async promise or sync return value)
    const resolved: Promise<OnPasteResultOrPromise> = Promise.resolve(resolveOnPasteResultOrError())
    return resolved
      .then((result: OnPasteResult) => {
        onLoading({paste: null})
        if (result === undefined) {
          return next()
        }
        if (result instanceof Error) {
          throw result
        }
        if (result && result.insert) {
          const allowedDecorators = this.props.blockContentFeatures.decorators.map(item => item.value)
          const blocksToInsertNormalized = result.insert.map(block => normalizeBlock(block, {allowedDecorators}))
          const patches = [
            setIfMissing(blocksToInsertNormalized),
            this.props.value && this.props.value.length !== 0
              ? insert(blocksToInsertNormalized, 'after', result.path || focusPath)
              : set(blocksToInsertNormalized, [])
          ]
          onPatch(PatchEvent.from(patches))
          onLoading({paste: null})
          return result.insert
        }
        console.warn('Your onPaste function returned something unexpected:', result) // eslint-disable-line no-console
        return result
      })
      .catch(error => {
        onLoading({paste: null})
        console.error(error) // eslint-disable-line no-console
        return error
      })
  }
  handleCopy = (event: React.SyntheticEvent, editor: SlateEditor, next: (arg0: void) => void) => {
    if (onCopy) {
      return onCopy({event})
    }
    return next()
  }
  // We do our own handling of dropping blocks and inline nodes,
  // so break the slate plugin stack if transferring those node objects.
  handleDrag = (event: React.DragEvent, editor: SlateEditor, next: (arg0: void) => void) => {
    const transfer = getEventTransfer(event)
    const {node} = transfer
    if (node && (node.object === 'block' || node.object === 'inline')) {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault()
      return true
    }
    return next()
  }
  handleToggleFullscreen = (
    event: React.SyntheticEvent,
    editor: SlateEditor,
    next: (arg0: void) => void
  ) => {
    const isFullscreenKey = isKeyHotkey('mod+enter')
    const isEsc = isKeyHotkey('esc')
    const {onToggleFullScreen, fullscreen} = this.props
    if (isFullscreenKey(event) || (isEsc(event) && fullscreen)) {
      event.preventDefault()
      event.stopPropagation()
      onToggleFullScreen(event)
      return true
    }
    return next()
  }
  handleCancelEvent = (event: React.SyntheticEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }
  refBlockDragMarker = (blockDragMarker: HTMLDivElement | null) => {
    this.blockDragMarker = blockDragMarker
  }
  // eslint-disable-next-line complexity
  renderNode = (props: SlateComponentProps) => {
    const {
      blockContentFeatures,
      editorValue,
      onFocus,
      onPatch,
      readOnly,
      renderCustomMarkers,
      type,
      value
    } = this.props
    const {node} = props
    let ObjectClass: any = BlockObject
    let ObjectType = blockContentFeatures.types.blockObjects.find(
      memberType => memberType.name === node.type
    )
    if (node.object === 'inline') {
      ObjectClass = InlineObject
      ObjectType = blockContentFeatures.types.inlineObjects.find(
        memberType => memberType.name === node.type
      )
    }
    let markers = []
    if (node.object === 'inline') {
      markers = this.props.markers.filter(
        marker => marker.path[2] && getKey(marker.path[2]) === node.data.get('_key')
      )
    }
    if (node.type === 'span') {
      markers = this.props.markers.filter(
        marker => marker.path[2] && getKey(marker.path[2]) === node.data.get('_key')
      )
      // Add any markers for related markDefs here as well
      let annotations
      if ((annotations = node.data.get('annotations'))) {
        const block = props.editor.value.document.getParent(node.key)
        Object.keys(annotations).forEach(key => {
          markers = markers.concat(
            this.props.markers.filter(
              marker =>
                marker.path[0] &&
                getKey(marker.path[0]) === block.key &&
                marker.path[1] &&
                marker.path[1] === 'markDefs' &&
                marker.path[2] &&
                getKey(marker.path[2]) === getKey(annotations[key])
            )
          )
        })
      }
    }
    switch (node.type) {
      case 'contentBlock':
        return (
          <ContentBlock
            attributes={props.attributes}
            block={
              value
                ? value.find(blk => blk._key === node.key)
                : editorValueToBlocks(
                    {document: {nodes: [node.toJSON(VALUE_TO_JSON_OPTS)]}},
                    type
                  )[0]
            }
            blockContentFeatures={blockContentFeatures}
            editor={props.editor}
            markers={markers}
            node={node}
            onFocus={onFocus}
            readOnly={readOnly}
            renderCustomMarkers={renderCustomMarkers}
          >
            {props.children}
          </ContentBlock>
        )
      case 'span':
        return (
          <Span
            attributes={props.attributes}
            blockContentFeatures={blockContentFeatures}
            editor={props.editor}
            markers={markers}
            node={props.node}
            onFocus={onFocus}
            onPatch={onPatch}
            readOnly={readOnly}
            type={blockContentFeatures.types.span}
          >
            {props.children}
          </Span>
        )
      default:
        return (
          <ObjectClass
            attributes={props.attributes}
            blockContentFeatures={blockContentFeatures}
            editor={props.editor}
            editorValue={editorValue}
            isSelected={props.isFocused}
            markers={markers}
            node={props.node}
            onFocus={onFocus}
            onHideBlockDragMarker={this.handleHideBlockDragMarker}
            onPatch={onPatch}
            onShowBlockDragMarker={this.handleShowBlockDragMarker}
            readOnly={readOnly}
            renderCustomMarkers={renderCustomMarkers}
            type={ObjectType}
          />
        )
    }
  }
  renderMark = (props: SlateMarkProps) => {
    const {blockContentFeatures} = this.props
    const type = props.mark.type
    const decorator = blockContentFeatures.decorators.find(item => item.value === type)
    const CustomComponent =
      decorator && decorator.blockEditor && decorator.blockEditor.render
        ? decorator.blockEditor.render
        : null
    if (CustomComponent) {
      return <CustomComponent {...props} />
    }
    return decorator ? <Decorator {...props} /> : null
  }
  render() {
    const {
      blockContentFeatures,
      editorValue,
      fullscreen,
      markers,
      onFocus,
      onPatch,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      userIsWritingText,
      value
    } = this.props
    const hasMarkers = markers.filter(marker => marker.path.length > 0).length > 0
    const classNames = [
      styles.root,
      (renderBlockActions || hasMarkers) && styles.hasBlockExtras,
      fullscreen ? styles.fullscreen : null
    ].filter(Boolean)
    return (
      <div className={classNames.join(' ')}>
        <SlateReactEditor
          spellCheck={false}
          className={styles.editor}
          ref={this.editor}
          value={editorValue}
          onChange={this.handleChange}
          onFocus={this.handleEditorFocus}
          onCopy={this.handleCopy}
          onPaste={this.handlePaste}
          onKeyDown={this.handleToggleFullscreen}
          onDragOver={this.handleDrag}
          onDrop={this.handleDrag}
          plugins={this.plugins}
          readOnly={readOnly}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          schema={this.editorSchema}
        />
        <div
          className={styles.blockDragMarker}
          ref={this.refBlockDragMarker}
          style={{display: 'none'}}
          onDragOver={this.handleCancelEvent}
        />
        <div className={styles.blockExtras}>
          <BlockExtrasOverlay
            blockContentFeatures={blockContentFeatures}
            fullscreen={fullscreen}
            editor={this.editor}
            editorValue={editorValue}
            markers={markers}
            onFocus={onFocus}
            onPatch={onPatch}
            renderBlockActions={readOnly ? undefined : renderBlockActions}
            renderCustomMarkers={renderCustomMarkers}
            userIsWritingText={userIsWritingText}
            value={value}
          />
        </div>
      </div>
    )
  }
}
