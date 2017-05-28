import PropTypes from 'prop-types'
import React from 'react'

import ReactDOM from 'react-dom'
import OffsetKey from 'slate/lib/utils/offset-key'
import {findDOMNode} from 'slate'
import ItemForm from './ItemForm'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import Preview from '../../Preview'
import styles from './styles/FormBuilderBlock.css'
import createRange from './util/createRange'
import {applyAll} from '../../simplePatch'
import {debounce} from 'lodash'
import {resolveTypeName} from '../../utils/resolveType'
import InvalidValue from './InvalidValue'

export default class FormBuilderBlock extends React.Component {
  static propTypes = {
    // Note: type refers to the array type, not the value type
    type: PropTypes.object,
    node: PropTypes.object,
    editor: PropTypes.object,
    state: PropTypes.object,
    attributes: PropTypes.object
  }

  state = {
    isSelected: false,
    isFocused: false,
    isEditing: false,
    isDragging: false
  }

  _dropTarget = null
  _editorNode = null

  componentWillUpdate(nextProps) {
    const {node} = this.props
    const selection = nextProps.state.selection
    if (selection !== this.props.state.selection) {
      const isFocused = selection.hasFocusIn(node)
      this.setState({isFocused})
    }
  }

  componentDidMount() {
    this.addSelectionHandler()
  }

  componentWillUnmount() {
    this.removeSelectionHandler()
  }

  handleChange = event => {
    const {node, editor} = this.props
    const next = editor.getState()
      .transform()
      .setNodeByKey(node.key, {
        data: {value: applyAll(node.data.get('value'), event.patches)}
      })
      .apply()

    editor.onChange(next)
  }

  handleRemove = debounce(() => {
    // debounced because there seems to be a race condition with clicks and state updates
    const {node, editor} = this.props
    const next = editor.getState()
      .transform()
      .removeNodeByKey(node.key)
      .apply()

    editor.onChange(next)
  }, 0)

  handleDragStart = event => {
    const {editor} = this.props
    this._editorNode = ReactDOM.findDOMNode(editor)

    this.setState({isDragging: true})
    this.addDragHandlers()

    const element = ReactDOM.findDOMNode(this.previewContainer)
    event.dataTransfer.setData('text/plain', event.target.id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setDragImage(element, (element.clientWidth / 2), -10)
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
    const selection = document.getSelection()
    const isSelected = selection.containsNode
        && selection.containsNode(this.formBuilderBlock)
    this.setState({isSelected})
  }

  // Remove the drop target if we leave the editors nodes
  handleDragLeave = event => {
    event.stopPropagation()
    this.hideBlockDragMarker()
    if (event.target === this._editorNode) {
      this.resetDropTarget()
    }
  }

  resetDropTarget() {
    this._dropTarget = null
    this.hideBlockDragMarker()
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

    const offsetKey = OffsetKey.findKey(targetDOMNode, 0)
    if (!offsetKey) {
      return
    }
    const {key} = offsetKey

    const {editor} = this.props
    const state = editor.getState()
    const {document} = state
    const range = createRange(event)

    if (range === null) {
      return
    }

    const {rangeIsAtStart, rangeOffset} = range

    const node = document.getClosestBlock(key)

    if (!node) {
      this.resetDropTarget()
      return
    }

    if (node.type === 'contentBlock') {
      const domNode = findDOMNode(node)
      if (rangeIsAtStart) {
        this.showBlockDragMarker('before', domNode)
      } else {
        this.showBlockDragMarker('after', domNode)
      }
    }
    this._dropTarget = {node: node, isAtStart: rangeIsAtStart, offset: rangeOffset}
  }

  handleDragEnd = event => {
    this.setState({isDragging: false})
    this.removeDragHandlers()

    const {editor, node} = this.props
    const state = editor.getState()

    const target = this._dropTarget

    // Return if this is our node
    if (!target || target.node === node) {
      return
    }

    let transform
    transform = state.transform().removeNodeByKey(node.key)
    transform = this.moveToDroptarget(transform, target)

    this.resetDropTarget()

    // Move cursor and apply
    const next = transform.collapseToEndOf(node)
      .focus()
      .apply()

    editor.onChange(next)
  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  moveToDroptarget(transform, target) {
    const {node} = this.props
    let next = transform
    if (target.isAtStart) {
      next = next.collapseToStartOf(target.node)
    } else {
      next = next.collapseToEndOf(target.node)
    }
    return next.insertBlock(node)
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
          onRemove={this.handleRemove}
        />
      )
    }
    return (
      <div onClick={this.handleToggleEdit}>
        <Preview
          type={memberType}
          value={this.getValue()}
          layout="block"
        />
      </div>
    )
  }

  refFormBuilderBlock = formBuilderBlock => {
    this.formBuilderBlock = formBuilderBlock
  }

  refPreview = previewContainer => {
    this.previewContainer = previewContainer
  }

  renderInput() {
    const value = this.getValue()
    const memberType = this.getMemberTypeOf(value)

    return (
      <EditItemPopOver
        title={this.props.node.title}
        onClose={this.handleClose}
      >
        <ItemForm
          onDrop={this.handleCancelEvent}
          type={memberType}
          level={0}
          value={this.getValue()}
          onChange={this.handleChange}
        />
      </EditItemPopOver>
    )
  }

  showBlockDragMarker(pos, node) {
    const {editor} = this.props
    editor.props.blockEditor.showBlockDragMarker(pos, node)
  }

  hideBlockDragMarker() {
    const {editor} = this.props
    editor.props.blockEditor.hideBlockDragMarker()
  }

  render() {
    const {isEditing} = this.state
    const {attributes} = this.props

    let className
    if (this.state.isFocused) {
      className = styles.focused
    } else if (this.state.isSelected) {
      className = styles.selected
    } else {
      className = styles.root
    }

    return (
      <div
        {...attributes}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onDragOver={this.handleDragOver}
        draggable
        ref={this.refFormBuilderBlock}
        className={className}
      >
        <span
          ref={this.refPreview}
          className={styles.previewContainer}
        >
          {this.renderPreview()}
        </span>

        {isEditing && (
          <div className={styles.editBlockContainer}>
            {this.renderInput()}
          </div>
        )}
      </div>
    )
  }
}
