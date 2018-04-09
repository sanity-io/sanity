// @flow
import type {BlockContentFeatures, SlateValue, Type, SlateChange, Marker} from '../typeDefs'
import type {Node} from 'react'
import ReactDOM from 'react-dom'
import Base64 from 'slate-base64-serializer'

import React from 'react'
import {Block, Range} from 'slate'
import {Editor, setEventTransfer, getEventRange} from 'slate-react'

import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'

import InvalidValue from '../../InvalidValueInput'
import Preview from '../../../Preview'

import styles from './styles/InlineObject.css'

type Props = {
  attributes: {},
  blockContentFeatures: BlockContentFeatures,
  children: Node,
  editorValue: SlateValue,
  markers: Marker[],
  node: Block,
  editor: Editor,
  editorIsFocused: boolean,
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  onPatch: (event: PatchEvent) => void,
  isSelected: boolean,
  type: ?Type
}

type State = {
  isDragging: boolean,
  isEditing: boolean,
  isSelected: boolean
}

function shouldUpdateDropTarget(range, dropTarget) {
  if (!dropTarget) {
    return true
  }
  return range.focusOffset !== dropTarget.range.focusOffset
}

export default class InlineObject extends React.Component<Props, State> {
  rootElement: ?HTMLDivElement = null

  state = {
    isDragging: false
  }

  componentDidMount() {
    const {editor} = this.props
    this._editorNode = ReactDOM.findDOMNode(editor)
  }

  componentWillUnmount() {
    this.removeDragHandlers()
  }

  addDragHandlers() {
    this._editorNode.addEventListener('dragover', this.handleDragOverOtherNode)
    this._editorNode.addEventListener('dragleave', this.handleDragLeave)
  }

  removeDragHandlers() {
    this._editorNode.removeEventListener('dragover', this.handleDragOverOtherNode)
    this._editorNode.removeEventListener('dragleave', this.handleDragLeave)
  }

  handleDragStart = event => {
    const {node} = this.props
    this.setState({isDragging: true})
    this.addDragHandlers()
    const element = ReactDOM.findDOMNode(this.previewContainer)
    const encoded = Base64.serializeNode(node, {preserveKeys: true})
    setEventTransfer(event, 'node', encoded)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setDragImage(element, element.clientWidth / 2, -10)
  }

  // Remove the drop target if we leave the editors nodes
  handleDragLeave = event => {
    if (event.target === this._editorNode) {
      this.resetDropTarget()
    }
  }

  resetDropTarget() {
    this._dropTarget = null
  }

  handleDragOverOtherNode = event => {
    if (!this.state.isDragging) {
      return
    }

    const targetDOMNode = event.target

    // As the event is registered on the editor parent node
    // ignore the event if it is coming from from the editor node itself
    if (targetDOMNode === this._editorNode) {
      return
    }

    const {editorValue, onChange} = this.props

    const range = getEventRange(event, editorValue)
    if (range === null || typeof range.focusOffset === undefined) {
      return
    }

    const targetNode = editorValue.document.getDescendant(range.focusKey)

    // If we are dragging over another inline return
    if (editorValue.document.getClosestInline(targetNode.key)) {
      return
    }

    // If we are dragging over a custom type block return
    const block = editorValue.document.getClosestBlock(range.focusKey)
    if (block && block.type !== 'contentBlock') {
      return
    }

    const moveCursorChange = this.moveCursor(range, targetNode)
    const finalRange = moveCursorChange.value.selection
    if (shouldUpdateDropTarget(finalRange, this._dropTarget)) {
      this._dropTarget = {node: targetNode, range: finalRange}
      onChange(moveCursorChange)
    }
  }

  moveCursor(range, node) {
    const {editorValue} = this.props
    let theOffset = range.focusOffset

    // Check if it is acceptable to move the cursor here
    const nextChars = editorValue.document.getCharactersAtRange(
      Range.create({
        anchorKey: node.key,
        focusKey: node.key,
        anchorOffset: theOffset - 1,
        focusOffset: theOffset,
        isFocused: true,
        isBackward: false
      })
    )
    if (!nextChars.size) {
      theOffset = 0
    }
    const change = editorValue
      .change()
      .collapseToStartOf(node)
      .move(theOffset)
      .focus()
    return change
  }

  handleDragEnd = event => {
    this.setState({isDragging: false})

    const {onChange, node, editorValue} = this.props

    const target = this._dropTarget

    // Return if this is our node
    if (!target || target.node === node) {
      this.resetDropTarget()
      return
    }
    const change = editorValue
      .change()
      .select(target.range)
      .removeNodeByKey(node.key)
      .insertInline(node)
      .collapseToEndOf(node)
      .focus()

    onChange(change)

    this.resetDropTarget()
  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  handleEditStart = () => {
    const {editorValue, node, onFocus} = this.props
    const {focusBlock} = editorValue
    onFocus([{_key: focusBlock.key}, 'children', {_key: node.key}, FOCUS_TERMINATOR])
  }

  handleClose = () => {
    const {node, onFocus} = this.props
    onFocus([{_key: node.key}])
  }

  refFormBuilderBlock = formBuilderBlock => {
    this.formBuilderBlock = formBuilderBlock
  }

  refPreview = previewContainer => {
    this.previewContainer = previewContainer
  }

  getValue() {
    return this.props.node.data.get('value')
  }

  renderPreview() {
    const {type} = this.props
    const value = this.getValue()
    if (!type) {
      return (
        <InvalidValue
          validTypes={[type]}
          actualType={type}
          value={value}
          onChange={this.handleInvalidValueChange}
        />
      )
    }
    return <Preview type={type} value={this.getValue()} layout="block" />
  }

  render() {
    const {attributes, node, editorValue, editorIsFocused, isSelected} = this.props
    const isFocused = editorIsFocused && editorValue.selection.hasFocusIn(node)

    let className
    if (isFocused && !isSelected) {
      className = styles.focused
    } else if (isFocused && isSelected) {
      className = styles.focusedAndSelected
    } else if (isSelected) {
      className = styles.selected
    } else {
      className = styles.root
    }

    return (
      <span
        {...attributes}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onDragEnter={this.handleCancelEvent}
        onDragLeave={this.handleCancelEvent}
        onDrop={this.handleCancelEvent}
        draggable
        onClick={this.handleEditStart}
        ref={this.refFormBuilderBlock}
        className={className}
      >
        <span ref={this.refPreview} className={styles.previewContainer}>
          {this.renderPreview()}
        </span>
      </span>
    )
  }
}
