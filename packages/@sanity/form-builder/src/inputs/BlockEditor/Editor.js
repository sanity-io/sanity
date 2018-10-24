// @flow
import type {ElementRef} from 'react'

import React from 'react'
import ReactDOM from 'react-dom'
import SoftBreakPlugin from 'slate-soft-break'
import {findDOMNode, Editor as SlateEditor, getEventTransfer} from 'slate-react'
import {isEqual} from 'lodash'
import {isKeyHotkey} from 'is-hotkey'
import {EDITOR_DEFAULT_BLOCK_TYPE, editorValueToBlocks} from '@sanity/block-tools'
import insertBlockOnEnter from 'slate-insert-block-on-enter'
import onPasteFromPart from 'part:@sanity/form-builder/input/block-editor/on-paste?'
import onCopy from 'part:@sanity/form-builder/input/block-editor/on-copy?'

import {hasItemFocus} from '../../utils/pathUtils'
import PatchEvent, {insert} from '../../../PatchEvent'
import type {
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  Path,
  Patch,
  RenderBlockActions,
  RenderCustomMarkers,
  SlateChange,
  SlateComponentProps,
  SlateMarkProps,
  SlateNode,
  SlateSchema,
  SlateValue,
  Type,
  UndoRedoStack
} from './typeDefs'

import {VALUE_TO_JSON_OPTS} from './utils/createChangeToPatches'
import buildEditorSchema from './utils/buildEditorSchema'
import findInlineByAnnotationKey from './utils/findInlineByAnnotationKey'
import createBlockActionPatchFn from './utils/createBlockActionPatchFn'

import ExpandToWordPlugin from './plugins/ExpandToWordPlugin'
import InsertBlockObjectPlugin from './plugins/InsertBlockObjectPlugin'
import InsertInlineObjectPlugin from './plugins/InsertInlineObjectPlugin'
import ListItemOnEnterKeyPlugin from './plugins/ListItemOnEnterKeyPlugin'
import ListItemOnTabKeyPlugin from './plugins/ListItemOnTabKeyPlugin'
import OnDropPlugin from './plugins/OnDropPlugin'
import PastePlugin from './plugins/PastePlugin'
import QueryPlugin from './plugins/QueryPlugin'
import SetBlockStylePlugin from './plugins/SetBlockStylePlugin'
import SetMarksOnKeyComboPlugin from './plugins/SetMarksOnKeyComboPlugin'
import SplitNodePlugin from './plugins/SplitNodePlugin'
import MoveNodePlugin from './plugins/MoveNodePlugin'
import InsertNodePlugin from './plugins/InsertNodePlugin'
import TextBlockOnEnterKeyPlugin from './plugins/TextBlockOnEnterKeyPlugin'
import ToggleAnnotationPlugin from './plugins/ToggleAnnotationPlugin'
import ToggleListItemPlugin from './plugins/ToggleListItemPlugin'
import UndoRedoPlugin from './plugins/UndoRedoPlugin'
import WrapSpanPlugin from './plugins/WrapSpanPlugin'

import BlockObject from './nodes/BlockObject'
import ContentBlock from './nodes/ContentBlock'
import Decorator from './nodes/Decorator'
import InlineObject from './nodes/InlineObject'
import Span from './nodes/Span'

import styles from './styles/Editor.css'

type PasteProgressResult = {status: string | null, error?: Error}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  changeToPatches: (
    unchangedEditorValue: SlateValue,
    change: SlateChange,
    value: ?(FormBuilderValue[])
  ) => Patch[],
  editorValue: SlateValue,
  fullscreen: boolean,
  focusPath: Path,
  markers: Marker[],
  onBlur: (nextPath: []) => void,
  onChange: (change: SlateChange, callback?: (SlateChange) => void) => void,
  onLoading: (props: {}) => void,
  onFocus: Path => void,
  onLoading: (props: {}) => void,
  onPaste?: ({
    event: SyntheticEvent<>,
    path: [],
    type: Type,
    value: ?(FormBuilderValue[])
  }) => {insert?: FormBuilderValue[], path?: []},
  onPatch: (event: PatchEvent) => void,
  onToggleFullScreen: void => void,
  patchesToChange: (patches: Patch[], editorValue: SlateValue, snapshot: ?any) => SlateChange,
  readOnly?: boolean,
  renderBlockActions?: RenderBlockActions,
  renderCustomMarkers?: RenderCustomMarkers,
  setFocus: void => void,
  type: Type,
  undoRedoStack: UndoRedoStack,
  value: ?(FormBuilderValue[])
}

export default class Editor extends React.Component<Props> {
  static defaultProps = {
    readOnly: false,
    onPaste: null,
    renderCustomMarkers: null,
    renderBlockActions: null
  }
  _blockDragMarker: ?HTMLDivElement
  _editorSchema: SlateSchema

  _blockActionsMap = {}

  _controller: ElementRef<any> = React.createRef()

  _plugins = []

  constructor(props: Props) {
    super(props)
    this._editorSchema = buildEditorSchema(props.blockContentFeatures)
    this._plugins = [
      SplitNodePlugin(),
      InsertNodePlugin(),
      MoveNodePlugin(),
      ListItemOnEnterKeyPlugin({defaultBlock: EDITOR_DEFAULT_BLOCK_TYPE}),
      ListItemOnTabKeyPlugin(),
      TextBlockOnEnterKeyPlugin({defaultBlock: EDITOR_DEFAULT_BLOCK_TYPE}),
      SetMarksOnKeyComboPlugin({
        decorators: props.blockContentFeatures.decorators.map(item => item.value)
      }),
      SoftBreakPlugin({
        onlyIn: [EDITOR_DEFAULT_BLOCK_TYPE.type],
        shift: true
      }),
      PastePlugin({
        controller: this._controller,
        blockContentType: props.type,
        onChange: props.onChange,
        onProgress: this.handlePasteProgress
      }),
      insertBlockOnEnter(EDITOR_DEFAULT_BLOCK_TYPE),
      OnDropPlugin(),
      QueryPlugin(),
      SetBlockStylePlugin(),
      ToggleAnnotationPlugin(),
      ToggleListItemPlugin(),
      ExpandToWordPlugin(),
      WrapSpanPlugin(),
      InsertInlineObjectPlugin(props.type),
      InsertBlockObjectPlugin(),
      UndoRedoPlugin({
        stack: props.undoRedoStack,
        onChange: props.onChange,
        onPatch: props.onPatch,
        editorValue: props.editorValue,
        patchesToChange: props.patchesToChange,
        changeToPatches: props.changeToPatches,
        editorSchema: this._editorSchema,
        blockContentType: props.type
      })
    ]
  }

  componentDidMount() {
    const {editorValue, focusPath} = this.props
    if ((focusPath || []).length) {
      const block = editorValue.document.getDescendant(focusPath[0]._key)
      if (!block) {
        return
      }
      // Wait for things to get finshed rendered before scrolling there
      setTimeout(
        () =>
          window.requestAnimationFrame(() => {
            const element = findDOMNode(block) // eslint-disable-line react/no-find-dom-node
            element.scrollIntoView({behavior: 'instant', block: 'center', inline: 'nearest'})
          }),
        0
      )
    }
  }

  // When focusPath has changed, but the editorValue has another focusBlock,
  // select the block according to the focusPath and scroll there
  componentDidUpdate(prevProps: Props) {
    const controller = this.getController()
    if (!controller) {
      return
    }
    const {focusPath, editorValue, readOnly} = this.props
    if (!focusPath || focusPath.length === 0) {
      return
    }
    const focusPathIsSingleBlock =
      editorValue.focusBlock && isEqual(focusPath, [{_key: editorValue.focusBlock.key}])
    const focusPathChanged = !isEqual(prevProps.focusPath, focusPath)
    if (!focusPathChanged) {
      return
    }
    // eslint-disable-next-line complexity
    controller.change(change => {
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
          this.scrollIntoView(change, inline)
        } else if (
          // Annotation
          focusPath[1] &&
          focusPath[1] === 'markDefs' &&
          focusPath[2] &&
          (inline = findInlineByAnnotationKey(focusPath[2]._key, block))
        ) {
          this.scrollIntoView(change, inline)
        } else if (block) {
          // Regular block
          this.scrollIntoView(change, block)
        }
      } else if (!readOnly) {
        // Must be here to set focus after editing interfaces are closed
        inline = editorValue.focusInline
        if (inline) {
          // There are some issues where you can't move the cursor
          // if the focus is collapsed on an inline-node, move forward to next text.
          change.moveForward()
        }
        change.focus()
      }
    })
  }

  scrollIntoView(change: SlateChange, node: SlateNode) {
    const {readOnly} = this.props
    const element = findDOMNode(node) // eslint-disable-line react/no-find-dom-node
    element.scrollIntoView({behavior: 'instant', block: 'center', inline: 'nearest'})
    if (!readOnly) {
      change.moveToEndOfNode(node)
    }
  }

  // When user changes the selection in the editor, update focusPath accordingly.
  handleChange = (change: SlateChange) => {
    const {onChange, onFocus, focusPath} = this.props
    const {focusBlock} = change.value
    const path = []
    if (focusBlock) {
      path.push({_key: focusBlock.key})
    }
    if (path.length && focusPath && focusPath.length === 1) {
      return onChange(change, () => onFocus(path))
    }
    return onChange(change)
  }

  handleEditorFocus = () => {
    const {setFocus} = this.props
    setFocus()
  }

  getValue = () => {
    return this.props.value
  }

  getController = () => {
    if (this._controller && this._controller.current) {
      return this._controller.current
    }
    return null
  }

  handlePasteProgress = ({status}: PasteProgressResult) => {
    const {onLoading} = this.props
    onLoading({paste: status})
  }

  handleShowBlockDragMarker = (pos: string, node: HTMLDivElement) => {
    // eslint-disable-next-line react/no-find-dom-node
    const controllerDOMNode = ReactDOM.findDOMNode(this.getController())
    if (controllerDOMNode instanceof HTMLElement) {
      const controllerRect = controllerDOMNode.getBoundingClientRect()
      const elemRect = node.getBoundingClientRect()
      const topPos = Number((elemRect.top - controllerRect.top).toFixed(1)).toFixed(2)
      const bottomPos = Number(
        parseInt(topPos + (elemRect.bottom - elemRect.top), 10).toFixed(1)
      ).toFixed(2)
      const top = pos === 'after' ? `${bottomPos}px` : `${topPos}px`
      if (this._blockDragMarker) {
        this._blockDragMarker.style.display = 'block'
        this._blockDragMarker.style.top = top
      }
    }
  }

  handleHideBlockDragMarker = () => {
    if (this._blockDragMarker) {
      this._blockDragMarker.style.display = 'none'
    }
  }

  handlePaste = (event: SyntheticEvent<>, change: SlateChange, next: void => void) => {
    const onPaste = this.props.onPaste || onPasteFromPart
    if (!onPaste) {
      return next()
    }
    const {focusPath, onPatch, onLoading, value, type} = this.props
    onLoading({paste: 'start'})
    const {focusBlock, selection, focusText, focusInline} = change.value
    const path = []
    if (focusBlock) {
      path.push({_key: focusBlock.key})
    }
    if (focusInline || focusText) {
      path.push('children')
      path.push({_key: selection.focus.key})
    }
    const result = onPaste({event, value, path, type})
    if (result && result.insert) {
      onPatch(PatchEvent.from([insert([result.insert], 'after', result.path || focusPath)]))
      onLoading({paste: null})
      return result.insert
    }
    onLoading({paste: null})
    return next()
  }

  handleCopy = (event: SyntheticEvent<>, change: SlateChange, next: void => void) => {
    if (onCopy) {
      return onCopy({event})
    }
    return next()
  }

  // We do our own handling of dropping blocks and inline nodes,
  // so break the slate plugin stack if transferring those node objects.
  handleDrag = (event: SyntheticDragEvent<>, change: SlateChange, next: void => void) => {
    const transfer = getEventTransfer(event)
    const {node} = transfer
    if (node && (node.object === 'block' || node.object === 'inline')) {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault()
      return true
    }
    return next()
  }

  handleOnKeyDown = (event: SyntheticEvent<>, change: SlateChange, next: void => void) => {
    const isFullscreenKey = isKeyHotkey('mod+enter')
    const {onToggleFullScreen} = this.props
    if (isFullscreenKey(event)) {
      event.preventDefault()
      event.stopPropagation()
      onToggleFullScreen()
    }
    return next()
  }

  handleCancelEvent = (event: SyntheticEvent<>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  refBlockDragMarker = (blockDragMarker: ?HTMLDivElement) => {
    this._blockDragMarker = blockDragMarker
  }

  renderNode = (props: SlateComponentProps) => {
    const {
      blockContentFeatures,
      editorValue,
      focusPath,
      markers,
      onFocus,
      onPatch,
      readOnly,
      value,
      renderCustomMarkers,
      type
    } = this.props
    const {node} = props
    let childMarkers = markers
      .filter(marker => marker.path.length > 0)
      .filter(marker => marker.path[0]._key === node.data.get('_key'))
    let ObjectClass = BlockObject
    let ObjectType = blockContentFeatures.types.blockObjects.find(
      memberType => memberType.name === node.type
    )

    if (node.object === 'inline') {
      ObjectClass = InlineObject
      ObjectType = blockContentFeatures.types.inlineObjects.find(
        memberType => memberType.name === node.type
      )
      childMarkers = markers.filter(
        marker => marker.path[2] && marker.path[2]._key === node.data.get('_key')
      )
    }

    if (node.type === 'span') {
      childMarkers = markers.filter(
        marker => marker.path[2] && marker.path[2]._key === node.data.get('_key')
      )
      // Add any markers for related markDefs here as well
      let annotations
      if ((annotations = node.data.get('annotations'))) {
        const block = editorValue.document.getParent(node.key)
        Object.keys(annotations).forEach(key => {
          childMarkers = childMarkers.concat(
            markers.filter(
              marker =>
                marker.path[0]._key === block.key &&
                marker.path[1] === 'markDefs' &&
                marker.path[2]._key === annotations[key]._key
            )
          )
        })
      }
    }

    // Set prop on blocks that are included in focusPath
    let hasFormBuilderFocus = false
    if (node.object === 'block') {
      hasFormBuilderFocus = focusPath ? hasItemFocus(focusPath, {_key: node.key}) : false
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
            blockActions={this._blockActionsMap[node.key]}
            blockContentFeatures={blockContentFeatures}
            controller={props.editor}
            editorValue={editorValue}
            hasFormBuilderFocus={hasFormBuilderFocus}
            markers={childMarkers}
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
            controller={props.editor}
            editorValue={editorValue}
            markers={childMarkers}
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
            controller={props.editor}
            editorValue={editorValue}
            hasFormBuilderFocus={hasFormBuilderFocus}
            isSelected={props.isFocused}
            markers={childMarkers}
            node={props.node}
            onFocus={onFocus}
            onHideBlockDragMarker={this.handleHideBlockDragMarker}
            onPatch={onPatch}
            onShowBlockDragMarker={this.handleShowBlockDragMarker}
            readOnly={readOnly}
            blockActions={this._blockActionsMap[node.key]}
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
      readOnly,
      markers,
      renderBlockActions,
      value,
      onPatch
    } = this.props

    const hasMarkers = markers.filter(marker => marker.path.length > 0).length > 0

    // Figure out if we have any block actions
    let hasBlockActions = false
    if (renderBlockActions && value) {
      this._blockActionsMap = {}
      const RenderComponent = renderBlockActions
      value.forEach(block => {
        const actions = (
          <RenderComponent
            block={block}
            value={value}
            set={createBlockActionPatchFn('set', block, onPatch)}
            unset={createBlockActionPatchFn('unset', block, onPatch)}
            insert={createBlockActionPatchFn('insert', block, onPatch)}
          />
        )
        if (actions) {
          this._blockActionsMap[block._key] = actions
        }
      })
      hasBlockActions = Object.keys(this._blockActionsMap).length > 0
    }

    const classNames = [
      styles.root,
      (hasBlockActions || hasMarkers) && styles.hasBlockExtras,
      fullscreen ? styles.fullscreen : null
    ].filter(Boolean)

    return (
      <div className={classNames.join(' ')}>
        <SlateEditor
          spellCheck={false}
          className={styles.editor}
          ref={this._controller}
          value={editorValue}
          onChange={this.handleChange}
          onFocus={this.handleEditorFocus}
          onCopy={this.handleCopy}
          onPaste={this.handlePaste}
          onKeyDown={this.handleOnKeyDown}
          onDragOver={this.handleDrag}
          onDrop={this.handleDrag}
          plugins={this._plugins}
          readOnly={readOnly}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          schema={this._editorSchema}
        />
        <div
          className={styles.blockDragMarker}
          ref={this.refBlockDragMarker}
          style={{display: 'none'}}
          onDragOver={this.handleCancelEvent}
        />
      </div>
    )
  }
}
