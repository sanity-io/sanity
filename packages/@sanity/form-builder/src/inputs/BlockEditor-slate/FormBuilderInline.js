import PropTypes from 'prop-types'
import React from 'react'

import ReactDOM from 'react-dom'
import OffsetKey from 'slate-react/lib/utils/offset-key'
import setTransferData from 'slate-react/lib/utils/set-transfer-data'
import TRANSFER_TYPES from 'slate-react/lib/constants/transfer-types'
import Base64 from 'slate-base64-serializer'
import {Selection} from 'slate'
import ItemForm from './ItemForm'
import Popover from 'part:@sanity/components/dialogs/popover'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Preview from '../../Preview'
import styles from './styles/FormBuilderInline.css'
import createRange from './util/createRange'
import {applyAll} from '../../simplePatch'
import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValue from '../InvalidValueInput'
import StopPropagation from './StopPropagation'

export default class FormBuilderInline extends React.Component {
  static propTypes = {
    // Note: type refers to the array type, not the value type
    type: PropTypes.object,
    node: PropTypes.object,
    editor: PropTypes.object,
    state: PropTypes.object,
    attributes: PropTypes.object,
    onPatch: PropTypes.func
  }

  state = {
    isSelected: false,
    isEditing: false,
    isDragging: false
  }

  _dropTarget = null
  _editorNode = null

  componentDidMount() {
    this.addSelectionHandler()
  }

  componentWillUnmount() {
    this.removeSelectionHandler()
  }

  handleChange = event => {
    const {onPatch, node} = this.props
    onPatch(event.prefixAll(node.key))
  }

  handleInvalidValueChange = event => {
    const {onPatch, node} = this.props
    onPatch(event.prefixAll(node.key))
  }

  handleDragStart = event => {
    const {editor} = this.props
    this._editorNode = ReactDOM.findDOMNode(editor)

    this.setState({isDragging: true})
    this.addDragHandlers()

    const element = ReactDOM.findDOMNode(this.previewContainer)
    const encoded = Base64.serializeNode(this.props.node, {preserveKeys: true})
    setTransferData(event.dataTransfer, TRANSFER_TYPES.NODE, encoded)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setDragImage(element, element.clientWidth / 2, -10)
  }

  addSelectionHandler() {
    document.addEventListener('selectionchange', this.handleSelectionChange)
  }

  removeSelectionHandler() {
    document.removeEventListener('selectionchange', this.handleSelectionChange)
  }

  addDragHandlers() {
    this._editorNode.addEventListener('dragover', this.handleDragOverOtherNode)
    this._editorNode.addEventListener('dragleave', this.handleDragLeave)
  }

  removeDragHandlers() {
    this._editorNode.removeEventListener('dragover', this.handleDragOverOtherNode)
    this._editorNode.removeEventListener('dragleave', this.handleDragLeave)
  }

  handleSelectionChange = event => {
    if (!this._editorNode || !this._editorNode.contains(event.target)) {
      return
    }
    const selection = document.getSelection()
    const isSelected = selection.containsNode && selection.containsNode(this.formBuilderInline)
    this.setState({isSelected})
  }

  // Remove the drop target if we leave the editors nodes
  handleDragLeave = event => {
    if (event.target === this._editorNode) {
      this._dropTarget = null
    }
  }

  handleDragOverOtherNode = event => {
    if (!this.state.isDragging) {
      return
    }

    const targetDOMNode = event.target

    // As the event is registered on the editor parent node
    // ignore the event if it is coming from from the editor node itself
    if (targetDOMNode === this._editorNode) {
      this._dropTarget = null
      return
    }

    const offsetKey = OffsetKey.findKey(targetDOMNode, 0)
    if (!offsetKey) {
      return
    }
    const {key} = offsetKey

    // If this is 'our' node, return
    if (this.props.node.hasDescendant(key)) {
      return
    }

    const {editor} = this.props
    const state = editor.getState()
    const {document} = state

    const range = createRange(event)

    if (range === null) {
      return
    }

    const {rangeOffset} = range

    const node = document.getDescendant(key)

    if (!node) {
      this._dropTarget = null
      return
    }

    // If we are dragging over a custom type block return
    const block = document.getClosestBlock(node.key)
    if (block && block.type !== 'contentBlock') {
      return
    }

    // If we are dragging over another inline return
    if (document.getClosestInline(node.key)) {
      return
    }

    this._dropTarget = {node: node, offset: rangeOffset}
    this.moveCursor(rangeOffset, node)
  }

  handleDragEnd = event => {
    this.setState({isDragging: false})
    this.removeDragHandlers()

    if (!this._dropTarget) {
      return
    }

    const {editor, node} = this.props
    const state = editor.getState()
    const change = state
      .change()
      .removeNodeByKey(node.key)
      .insertInline(node)
      .focus()
    this._dropTarget = null
    editor.onChange(change)
  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  getValue() {
    return this.props.node.data.get('value')
  }

  handleToggleEdit = () => {
    this.setState({isEditing: true})
  }

  handleClose = () => {
    this.setState({isEditing: false})
  }

  getMemberTypeOf(value) {
    const typeName = resolveTypeName(value)
    return this.props.type.of.find(memberType => memberType.name === typeName)
  }

  renderPreview() {
    const value = this.getValue()
    const memberType = this.getMemberTypeOf(value)
    if (!memberType) {
      const validMemberTypes = this.props.type.of.map(type => type.name)
      const actualType = resolveTypeName(value)
      return (
        <InvalidValue
          validTypes={validMemberTypes}
          actualType={actualType}
          value={value}
          onChange={this.handleInvalidValueChange}
        />
      )
    }
    return (
      <span>
        <Preview type={memberType} value={this.getValue()} layout="inline" />
      </span>
    )
  }

  refFormBuilderInline = formBuilderInline => {
    this.formBuilderInline = formBuilderInline
  }

  refPreview = previewContainer => {
    this.previewContainer = previewContainer
  }

  handleDialogAction = action => {
    if (action.name === 'close') {
      this.handleClose()
    }
  }

  renderInput() {
    const value = this.getValue()
    const memberType = this.getMemberTypeOf(value)

    return (
      <Popover
        title={this.props.node.title}
        onClose={this.handleClose}
        onClickOutside={this.handleClose}
        onEscape={this.handleClose}
        onAction={this.handleDialogAction}
        modifiers={{
          flip: {
            boundariesElement: 'viewport'
          },
          preventOverflow: {
            priority: ['bottom', 'top', 'right', 'left'],
            boundariesElement: 'viewport'
          }
        }}
        showCloseButton={false}
        actions={[
          {
            index: '1',
            name: 'close',
            title: 'Close'
          }
        ]}
      >
        <DialogContent size="medium">
          <ItemForm
            onDrop={this.handleCancelEvent}
            type={memberType}
            level={0}
            value={this.getValue()}
            onChange={this.handleChange}
          />
        </DialogContent>
      </Popover>
    )
  }

  moveCursor(offset, node) {
    if (node.kind !== 'text') {
      return
    }
    const {editor} = this.props
    const state = editor.getState()
    const {document} = state
    let theOffset = offset

    // Check if it is acceptable to move the cursor here
    const nextChars = document.getCharactersAtRange(
      Selection.create({
        anchorKey: node.key,
        focusKey: node.key,
        anchorOffset: offset - 1,
        focusOffset: offset,
        isFocused: true,
        isBackward: false
      })
    )
    if (!nextChars.size) {
      theOffset = 0
    }

    const change = state
      .change()
      .collapseToStartOf(node)
      .move(theOffset)
      .focus()
    editor.onChange(change)
  }

  render() {
    const {isEditing} = this.state
    const {attributes} = this.props
    const {node, editor} = this.props
    const isFocused = editor.props.blockEditor.props.value.selection.hasFocusIn(node)

    let className
    if (isFocused && !this.state.isSelected) {
      className = styles.focused
    } else if (this.state.isSelected) {
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
        ref={this.refFormBuilderInline}
        className={className}
      >
        <span
          ref={this.refPreview}
          className={styles.previewContainer}
          onClick={this.handleToggleEdit}
        >
          {this.renderPreview()}
        </span>

        {isEditing && (
          <span className={styles.editInlineContainer}>
            <StopPropagation tagName="span">{this.renderInput()}</StopPropagation>
          </span>
        )}
      </span>
    )
  }
}
