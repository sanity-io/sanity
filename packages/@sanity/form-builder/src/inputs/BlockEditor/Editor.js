// @flow
import type {
  Block,
  BlockContentFeatures,
  Marker,
  SlateChange,
  SlateComponentProps,
  SlateMarkProps,
  SlateValue,
  Type
} from './typeDefs'
import type {Node} from 'react'

import React from 'react'
import ReactDOM from 'react-dom'

import SoftBreakPlugin from 'slate-soft-break'
import {findDOMNode, Editor as SlateEditor} from 'slate-react'
import {isEqual} from 'lodash'
import {isKeyHotkey} from 'is-hotkey'
import {EDITOR_DEFAULT_BLOCK_TYPE, editorValueToBlocks} from '@sanity/block-tools'
import insertBlockOnEnter from 'slate-insert-block-on-enter'
import onPasteFromPart from 'part:@sanity/form-builder/input/block-editor/on-paste?'
import onCopy from 'part:@sanity/form-builder/input/block-editor/on-copy?'

import {VALUE_TO_JSON_OPTS} from './utils/changeToPatches'
import {hasItemFocus} from '../../utils/pathUtils'
import createNodeValidator from './utils/createNodeValidator'
import findInlineByAnnotationKey from './utils/findInlineByAnnotationKey'
import PatchEvent, {insert} from '../../../PatchEvent'

import ListItemOnEnterKeyPlugin from './plugins/ListItemOnEnterKeyPlugin'
import ListItemOnTabKeyPlugin from './plugins/ListItemOnTabKeyPlugin'
import OnDropPlugin from './plugins/OnDropPlugin'
import PastePlugin from './plugins/PastePlugin'
import SetMarksOnKeyComboPlugin from './plugins/SetMarksOnKeyComboPlugin'
import TextBlockOnEnterKeyPlugin from './plugins/TextBlockOnEnterKeyPlugin'
import UpdateCustomNodesPlugin from './plugins/UpdateCustomNodesPlugin'
import UndoRedoPlugin from './plugins/UndoRedoPlugin'

import BlockObject from './nodes/BlockObject'
import ContentBlock from './nodes/ContentBlock'
import Decorator from './nodes/Decorator'
import InlineObject from './nodes/InlineObject'
import Span from './nodes/Span'

import styles from './styles/Editor.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  fullscreen: boolean,
  markers: Marker[],
  onBlur: (nextPath: []) => void,
  onChange: (change: SlateChange) => void,
  onEditorBlur: void => void,
  onEditorFocus: void => void,
  onFocus: (nextPath: []) => void,
  onFormBuilderInputBlur: (nextPath: []) => void,
  onFormBuilderInputFocus: (nextPath: []) => void,
  onPaste?: (
    event: SyntheticEvent,
    path: [],
    type: Type,
    value: ?Value
  ) => {insert?: Value, path?: []},
  onPatch: (event: PatchEvent) => void,
  onToggleFullScreen: void => void,
  readOnly?: boolean,
  renderBlockActions?: (block: Block) => React.Node,
  renderCustomMarkers?: (Marker[]) => React.Node,
  setFocus: void => void,
  type: Type,
  undoRedoStack: {undo: [], redo: []},
  value: Block[]
}

export default class Editor extends React.Component<Props> {
  _blockDragMarker: ?HTMLDivElement

  _blockActionsMap = {}

  _editor: ?(Node & SlateEditor) = null

  _plugins = []

  constructor(props: Props) {
    super(props)
    this._plugins = [
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
      PastePlugin({blockContentType: props.type}),
      insertBlockOnEnter(EDITOR_DEFAULT_BLOCK_TYPE),
      UpdateCustomNodesPlugin(),
      OnDropPlugin(),
      UndoRedoPlugin({
        stack: props.undoRedoStack,
        onChange: props.onChange,
        editorValue: props.editorValue,
        blockContentType: props.type
      })
    ]
    this._validateNode = createNodeValidator(props.type, this.getValue)
  }

  componentDidMount() {
    const {editorValue, focusPath} = this.props
    if ((focusPath || []).length) {
      const block = editorValue.document.getDescendant(focusPath[0]._key)
      // Wait for things to get finshed rendered before scrolling there
      setTimeout(
        () =>
          window.requestAnimationFrame(() => {
            const element = findDOMNode(block)
            element.scrollIntoView({behavior: 'instant', block: 'center', inline: 'nearest'})
          }),
        0
      )
    }
  }

  // When focusPath has changed, but the editorValue has another focusBlock,
  // select the block according to the focusPath and scroll there
  // eslint-disable-next-line complexity
  componentWillReceiveProps(nextProps: Props) {
    const {focusPath, editorValue, onChange, readOnly} = nextProps
    if (!focusPath || focusPath.length === 0) {
      return
    }
    const focusPathIsSingleBlock =
      editorValue.focusBlock && isEqual(focusPath, [{_key: editorValue.focusBlock.key}])
    const focusPathChanged = !isEqual(this.props.focusPath, nextProps.focusPath)
    const change = editorValue.change()
    const block = editorValue.document.getDescendant(focusPath[0]._key)
    let inline

    if (focusPathChanged && !focusPathIsSingleBlock) {
      if (focusPath[1] && focusPath[1] === 'children' && focusPath[2]) {
        // Inline object
        inline = editorValue.document.getDescendant(focusPath[2]._key)
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
    } else if (focusPathChanged && !readOnly) {
      // Must be here to set focus after editing interfaces are closed
      change.focus()
      onChange(change)
    }
  }

  scrollIntoView(change, node) {
    const {onChange, readOnly} = this.props
    const element = findDOMNode(node)
    element.scrollIntoView({behavior: 'instant', block: 'center', inline: 'nearest'})
    if (!readOnly) {
      change.collapseToEndOf(node)
      onChange(change)
    }
  }

  // When user changes the selection in the editor, update focusPath accordingly.
  handleChange = (change: slateChange) => {
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

  getEditor() {
    return this._editor
  }

  refEditor = (editor: ?SlateEditor) => {
    this._editor = editor
  }

  handleShowBlockDragMarker = (pos: string, node: HTMLDivElement) => {
    const editorDOMNode = ReactDOM.findDOMNode(this._editor)
    if (editorDOMNode instanceof HTMLElement) {
      const editorRect = editorDOMNode.getBoundingClientRect()
      const elemRect = node.getBoundingClientRect()
      const topPos = elemRect.top - editorRect.top
      const bottomPos = topPos + (elemRect.bottom - elemRect.top)
      const top = pos === 'after' ? `${parseInt(bottomPos, 10)}px` : `${parseInt(topPos, 10)}px`
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

  handlePaste = event => {
    const {focusPath, onPatch, value, type} = this.props
    const onPaste = this.props.onPaste || onPasteFromPart
    if (onPaste) {
      const {editorValue} = this.props
      const change = editorValue.change()
      const {focusBlock, focusKey, focusText, focusInline} = change.value
      const path = []
      if (focusBlock) {
        path.push({_key: focusBlock.key})
      }
      if (focusInline || focusText) {
        path.push('children')
        path.push({_key: focusKey})
      }
      const result = onPaste({event, value, path, type})
      if (result && result.insert) {
        onPatch(PatchEvent.from([insert([result.insert], 'after', result.path || focusPath)]))
        return result.insert
      }
    }
    return undefined
  }

  handleCopy = event => {
    if (onCopy) {
      return onCopy({event})
    }
    return undefined
  }

  handleOnKeyDown = event => {
    const isFullscreenKey = isKeyHotkey('mod+enter')
    const {onToggleFullScreen} = this.props
    if (isFullscreenKey(event)) {
      event.preventDefault()
      event.stopPropagation()
      onToggleFullScreen()
      return true
    }
    return undefined
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
      onChange,
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
            {...props}
            editorValue={editorValue}
            onChange={onChange}
            onFocus={onFocus}
            blockContentFeatures={blockContentFeatures}
            hasFormBuilderFocus={hasFormBuilderFocus}
            markers={childMarkers}
            readOnly={readOnly}
            blockActions={this._blockActionsMap[node.key]}
            renderCustomMarkers={renderCustomMarkers}
            block={
              value
                ? value.find(blk => blk._key === node.key)
                : editorValueToBlocks(
                    {document: {nodes: [node.toJSON(VALUE_TO_JSON_OPTS)]}},
                    type
                  )[0]
            }
          />
        )
      case 'span':
        return (
          <Span
            attributes={props.attributes}
            blockContentFeatures={blockContentFeatures}
            editorValue={editorValue}
            markers={childMarkers}
            node={props.node}
            onChange={onChange}
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
            hasFormBuilderFocus={hasFormBuilderFocus}
            isSelected={props.isSelected}
            markers={childMarkers}
            node={props.node}
            onChange={onChange}
            onDrag={this.handleDrag}
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
    const {editorValue, fullscreen, readOnly, markers, renderBlockActions, value} = this.props

    const hasMarkers = markers.filter(marker => marker.path.length > 0).length > 0

    // Figure out if we have any block actions
    let hasBlockActions = renderBlockActions
    if (hasBlockActions) {
      this._blockActionsMap = {}
      value.forEach(block => {
        const actions = renderBlockActions(block)
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
          ref={this.refEditor}
          value={editorValue}
          onChange={this.handleChange}
          onFocus={this.handleEditorFocus}
          onCopy={this.handleCopy}
          onPaste={this.handlePaste}
          onKeyDown={this.handleOnKeyDown}
          validateNode={this._validateNode}
          plugins={this._plugins}
          readOnly={readOnly}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
        />
        <div
          className={styles.blockDragMarker}
          ref={this.refBlockDragMarker}
          style={{display: 'none'}}
        />
      </div>
    )
  }
}
