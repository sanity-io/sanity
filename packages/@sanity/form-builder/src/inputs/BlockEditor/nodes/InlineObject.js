// @flow

import ReactDOM from 'react-dom'
import Base64 from 'slate-base64-serializer'

import React from 'react'
import {isEqual, throttle} from 'lodash'
import classNames from 'classnames'

import type {
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  Path,
  SlateEditor,
  SlateNode,
  SlateSelection,
  Type
} from '../typeDefs'

import {resolveTypeName} from '../../../utils/resolveTypeName'
import {PatchEvent} from '../../../PatchEvent'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'

import InvalidValue from '../../InvalidValueInput'
import Preview from '../../../Preview'

import styles from './styles/InlineObject.css'

import {Block, Range, Inline} from 'slate'
import {setEventTransfer, getEventRange} from 'slate-react'

type Props = {
  attributes: any,
  blockContentFeatures: BlockContentFeatures,
  editor: SlateEditor,
  hasFormBuilderFocus: boolean,
  isSelected?: boolean,
  markers: Marker[],
  node: Block,
  onFocus: Path => void,
  onPatch: (event: PatchEvent, value?: FormBuilderValue[]) => void,
  readOnly?: boolean,
  type: ?Type
}

type State = {
  isDragging: boolean
}

export default class InlineObject extends React.Component<Props, State> {
  static defaultProps = {
    isSelected: false,
    readOnly: false
  }

  _dropTarget: ?{node: SlateNode, selection: SlateSelection} = null
  _editorNode: ?HTMLElement = null
  _previewContainer: ?HTMLElement = null

  state = {
    isDragging: false
  }

  componentDidMount() {
    const {editor} = this.props
    const elm = ReactDOM.findDOMNode(editor) // eslint-disable-line react/no-find-dom-node
    if (elm instanceof HTMLElement) {
      this._editorNode = elm
    }
  }

  componentWillUnmount() {
    this.removeDragHandlers()
  }

  addDragHandlers() {
    if (this._editorNode) {
      this._editorNode.addEventListener('dragover', this.handleDragOverOtherNode)
    }
    if (this._editorNode) {
      this._editorNode.addEventListener('dragleave', this.handleDragLeave)
    }
  }

  removeDragHandlers() {
    if (this._editorNode) {
      this._editorNode.removeEventListener('dragover', this.handleDragOverOtherNode)
    }
    if (this._editorNode) {
      this._editorNode.removeEventListener('dragleave', this.handleDragLeave)
    }
  }

  handleDragStart = (event: SyntheticDragEvent<>) => {
    const {node} = this.props
    this.setState({isDragging: true})
    this.addDragHandlers()
    const element = ReactDOM.findDOMNode(this._previewContainer) // eslint-disable-line react/no-find-dom-node
    if (element && element instanceof HTMLElement) {
      const encoded = Base64.serializeNode(node, {preserveKeys: true})
      setEventTransfer(event, 'node', encoded)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setDragImage(element, element.clientWidth / 2, -10)
    }
    this.props.editor.moveToEndOfNode(this.props.node).focus()
  }

  // Remove the drop target if we leave the editors nodes
  handleDragLeave = (event: DragEvent) => {
    // must not be .currentTarget!
    if (event.target === this._editorNode) {
      this.resetDropTarget()
    }
  }

  resetDropTarget() {
    this._dropTarget = null
  }

  restoreSelection() {
    const {editor} = this.props
    editor.withoutSaving(() => {
      editor.moveToEndOfNode(this.props.node).focus()
    })
  }

  handleDragOverOtherNode = (event: DragEvent) => {
    if (!this.state.isDragging) {
      return
    }

    const targetDOMNode = event.target // Must not be .currentTarget!

    // As the event is registered on the editor parent node
    // ignore the event if it is coming from from the editor node itself
    if (targetDOMNode === this._editorNode) {
      this.restoreSelection()
      return
    }

    const {editor} = this.props

    const range = getEventRange(event, editor)
    if (range === null || typeof range.focus.offset === undefined) {
      this.restoreSelection()
      return
    }

    const targetNode = editor.value.document.getDescendant(range.focus.key)

    // If we are dragging over another inline return
    if (editor.value.document.getClosestInline(targetNode.key)) {
      this.restoreSelection()
      return
    }

    // If we are dragging over a custom type block return
    const block = editor.value.document.getClosestBlock(range.focus.key)
    if (block && block.type !== 'contentBlock') {
      return
    }
    this.moveCursor(range, targetNode)
  }

  moveCursor = throttle((range: Range, node: SlateNode) => {
    const {editor} = this.props
    let theOffset = range.focus.offset

    // Check if it is acceptable to move the cursor here
    const texts = editor.value.document.getTextsAtRange(
      Range.create({
        anchor: {
          key: node.key,
          offset: theOffset - 1
        },
        focus: {
          key: node.key,
          offset: theOffset
        }
      })
    )
    if (!texts.size) {
      theOffset = 0
    }
    return editor.withoutSaving(() => {
      editor
        .moveToStartOfNode(node)
        .moveForward(theOffset)
        .focus()
      const selection = editor.value.selection
      if (!this._dropTarget || range.focus.offset !== this._dropTarget.selection.focus.offset) {
        this._dropTarget = {node: node, selection}
      }
      return editor
    })
  }, 60)

  handleDragEnd = (event: SyntheticDragEvent<>) => {
    this.setState({isDragging: false})

    const {node, editor} = this.props

    const target = this._dropTarget

    // Return if this is our node
    if (!target || target.node === node) {
      this.resetDropTarget()
      return
    }
    editor.select(target.selection).removeNodeByKey(node.key)
    const {focusBlock, focusText} = editor.value
    // Create a new key for the "new" object
    let newNode = node.toJSON({preserveKeys: true, perserveData: true})
    const newKey = `${focusBlock.key}${focusBlock.nodes.indexOf(focusText) + 1}`
    newNode.data.value._key = newKey
    newNode.data._key = newKey
    newNode.key = newKey
    newNode = Inline.create(newNode)
    editor.insertInline(newNode)
    this.resetDropTarget()
  }

  handleInvalidValue = (event: PatchEvent) => {
    let _event = event
    const {editor, onPatch} = this.props
    const {focusBlock} = editor.value
    const value = this.getValue()
    const path = [{_key: focusBlock.key}, 'children', {_key: value._key}]
    path.reverse().forEach(part => {
      _event = _event.prefixAll(part)
    })
    onPatch(_event, value)
  }

  handleRemoveValue = (event: SyntheticMouseEvent<>) => {
    event.preventDefault()
    event.stopPropagation()
    const {node, editor} = this.props
    editor.removeNodeByKey(node.key).focus()
  }

  handleCancelEvent = (event: SyntheticEvent<>) => {
    event.stopPropagation()
    event.preventDefault()
  }

  handleEditStart = (event: SyntheticMouseEvent<>) => {
    event.stopPropagation()
    const {node, editor, readOnly} = this.props
    if (readOnly) {
      this.handleView(event)
      return
    }
    editor
      .moveToEndOfNode(node)
      .focus()
      .blur()
    setTimeout(() => {
      this.setFocus()
    }, 200)
  }

  setFocus = () => {
    const {editor, node, onFocus} = this.props
    const block = editor.value.document.getClosestBlock(node.key)
    onFocus([{_key: block.key}, 'children', {_key: node.key}, FOCUS_TERMINATOR])
  }

  handleView = (event: SyntheticMouseEvent<>) => {
    event.stopPropagation()
    this.setFocus()
  }

  refPreviewContainer = (elm: ?HTMLSpanElement) => {
    this._previewContainer = elm
  }

  getValue() {
    return this.props.node.data.get('value')
  }

  // eslint-disable-next-line complexity
  render() {
    const {
      attributes,
      blockContentFeatures,
      editor,
      isSelected,
      markers,
      node,
      readOnly,
      type
    } = this.props
    const value = this.getValue()
    const valueType = resolveTypeName(value)
    const validTypes = blockContentFeatures.types.inlineObjects.map(objType => objType.name)

    if (!validTypes.includes(valueType)) {
      return (
        <div onClick={this.handleCancelEvent}>
          <InvalidValue
            validTypes={validTypes}
            actualType={valueType}
            value={value}
            onChange={this.handleInvalidValue}
          />
        </div>
      )
    }
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')

    const classname = classNames([
      styles.root,
      editor.value.selection.focus.isInNode(node) && styles.focused,
      isSelected && styles.selected,
      errors.length > 0 && styles.hasErrors
    ])

    const valueKeys = value ? Object.keys(value) : []
    const isEmpty = !value || isEqual(valueKeys.sort(), ['_key', '_type'].sort())

    return (
      <span
        {...attributes}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onDragEnter={this.handleCancelEvent}
        onDragLeave={this.handleCancelEvent}
        onDrop={this.handleCancelEvent}
        draggable={!readOnly}
        className={classname}
        contentEditable={false}
      >
        <span
          onClick={this.handleEditStart}
          ref={this.refPreviewContainer}
          className={styles.previewContainer}
        >
          {!isEmpty && <Preview type={type} value={value} layout="inline" />}
          {isEmpty && !readOnly && <span>Click to edit</span>}
        </span>
      </span>
    )
  }
}
