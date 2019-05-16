// @flow
import type {ElementRef} from 'react'

import React from 'react'
import ReactDOM from 'react-dom'
import SoftBreakPlugin from 'slate-soft-break'
import {findDOMNode, Editor as SlateReactEditor, getEventTransfer} from 'slate-react'
import {isEqual} from 'lodash'
import {isKeyHotkey} from 'is-hotkey'
import {EDITOR_DEFAULT_BLOCK_TYPE, editorValueToBlocks} from '@sanity/block-tools'
import insertBlockOnEnter from 'slate-insert-block-on-enter'

import onPasteFromPart from 'part:@sanity/form-builder/input/block-editor/on-paste?'
import onCopy from 'part:@sanity/form-builder/input/block-editor/on-copy?'

import PatchEvent, {insert, set, setIfMissing} from '../../../PatchEvent'
import type {
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  Path,
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
import findInlineByAnnotationKey from './utils/findInlineByAnnotationKey'

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

type PasteProgressResult = {status: string | null, error?: Error}
type OnPasteResult = ?({insert?: FormBuilderValue[], path?: []} | Error)
type OnPasteResultOrPromise = ?(OnPasteResult | Promise<OnPasteResult>)
type OnPasteFn = ({
  event: SyntheticEvent<>,
  path: [],
  type: Type,
  value: ?(FormBuilderValue[])
}) => OnPasteResultOrPromise

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  fullscreen: boolean,
  focusPath: Path,
  markers: Marker[],
  onBlur: (nextPath: []) => void,
  onChange: (editor: SlateEditor, callback?: (void) => void) => void,
  onLoading: (props: {}) => void,
  onFocus: Path => void,
  onLoading: (props: {}) => void,
  onPaste?: OnPasteFn,
  onPatch: (event: PatchEvent) => void,
  onToggleFullScreen: (event: SyntheticEvent<*>) => void,
  readOnly?: boolean,
  renderBlockActions?: RenderBlockActions,
  renderCustomMarkers?: RenderCustomMarkers,
  scrollContainer: HTMLDivElement,
  setFocus: void => void,
  type: Type,
  undoRedoStack: UndoRedoStack,
  userIsWritingText: boolean,
  value: ?(FormBuilderValue[])
}

function scrollIntoView(node: SlateNode, opts = {}) {
  const element = findDOMNode(node) // eslint-disable-line react/no-find-dom-node
  element.scrollIntoView({
    behavior: opts.behavior || 'instant',
    block: opts.block || 'center',
    inline: opts.inline || 'nearest'
  })
}

export default class Editor extends React.Component<Props> {
  static defaultProps = {
    readOnly: false,
    onPaste: null,
    renderCustomMarkers: null,
    renderBlockActions: null
  }
  blockDragMarker: ?HTMLDivElement
  editorSchema: SlateSchema

  editor: ElementRef<any> = React.createRef()

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
      // OnBlurPlugin(),
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

  // Select the block according to the focusPath and scroll there
  // eslint-disable-next-line complexity
  trackFocusPath() {
    const {focusPath, editorValue} = this.props
    const editor = this.getEditor()
    if (!(editor && focusPath)) {
      return
    }
    const focusPathIsSingleBlock =
      editorValue.focusBlock && isEqual(focusPath, [{_key: editorValue.focusBlock.key}])
    const block = editorValue.document.getDescendant(focusPath[0]._key)
    let inline
    if (!focusPathIsSingleBlock) {
      if (focusPath[1] && focusPath[1] === 'children' && focusPath[2]) {
        // Inline object
        inline = editorValue.document.getDescendant(focusPath[2]._key)
        // eslint-disable-next-line max-depth
        if (!inline) {
          throw new Error(
            `Could not find a inline with key ${focusPath[2]._key}, something is amiss.`
          )
        }
        scrollIntoView(inline)
      } else if (
        // Annotation
        focusPath[1] &&
        focusPath[1] === 'markDefs' &&
        focusPath[2] &&
        (inline = findInlineByAnnotationKey(focusPath[2]._key, block))
      ) {
        scrollIntoView(inline)
      } else if (block) {
        // Regular block
        scrollIntoView(block)
      }
    }
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

  handleEditorFocus = (event: any, editor: SlateEditor, next: void => void) => {
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
    event: SyntheticEvent<>,
    editor: SlateEditor,
    next: void => void
  ): Promise<any> | ?((void) => void) => {
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
          const patches = [
            setIfMissing(result.insert),
            this.props.value && this.props.value.length !== 0
              ? insert(result.insert, 'after', result.path || focusPath)
              : set(result.insert, [])
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

  handleCopy = (event: SyntheticEvent<>, editor: SlateEditor, next: void => void) => {
    if (onCopy) {
      return onCopy({event})
    }
    return next()
  }

  // We do our own handling of dropping blocks and inline nodes,
  // so break the slate plugin stack if transferring those node objects.
  handleDrag = (event: SyntheticDragEvent<>, editor: SlateEditor, next: void => void) => {
    const transfer = getEventTransfer(event)
    const {node} = transfer
    if (node && (node.object === 'block' || node.object === 'inline')) {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault()
      return true
    }
    return next()
  }

  handleToggleFullscreen = (event: SyntheticEvent<>, editor: SlateEditor, next: void => void) => {
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

  handleCancelEvent = (event: SyntheticEvent<>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  refBlockDragMarker = (blockDragMarker: ?HTMLDivElement) => {
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
    let ObjectClass = BlockObject
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
        marker => marker.path[2] && marker.path[2]._key === node.data.get('_key')
      )
    }

    if (node.type === 'span') {
      markers = this.props.markers.filter(
        marker => marker.path[2] && marker.path[2]._key === node.data.get('_key')
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
                marker.path[0]._key === block.key &&
                marker.path[1] &&
                marker.path[1] === 'markDefs' &&
                marker.path[2] &&
                marker.path[2]._key === annotations[key]._key
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
            editorValue={editorValue}
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
            editorValue={editorValue}
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
            className={styles.blockExtrasOverlay}
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
