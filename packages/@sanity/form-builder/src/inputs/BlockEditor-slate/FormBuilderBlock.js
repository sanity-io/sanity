import PropTypes from 'prop-types'
import React from 'react'
import {get} from 'lodash'
import ReactDOM from 'react-dom'
import OffsetKey from 'slate-react/lib/utils/offset-key'
import setTransferData from 'slate-react/lib/utils/set-transfer-data'
import TRANSFER_TYPES from 'slate-react/lib/constants/transfer-types'
import Base64 from 'slate-base64-serializer'
import {findDOMNode} from 'slate-react'
import {FormBuilderInput} from '../../FormBuilderInput'

import Preview from '../../Preview'
import styles from './styles/FormBuilderBlock.css'
import createRange from './util/createRange'

import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValue from '../InvalidValue'
import * as PathUtils from '../../utils/pathUtils'
import EditBlockWrapper from './EditBlockWrapper'

export default class FormBuilderBlock extends React.Component {
  static propTypes = {
    // Note: type refers to the array type, not the value type
    type: PropTypes.object,
    node: PropTypes.object,
    editor: PropTypes.object,
    state: PropTypes.object,
    attributes: PropTypes.object,
    onPatch: PropTypes.func,
    focusPath: PropTypes.array,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
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

    const domNode = findDOMNode(node)
    if (rangeIsAtStart) {
      this.showBlockDragMarker('before', domNode)
    } else {
      this.showBlockDragMarker('after', domNode)
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
      this.resetDropTarget()
      return
    }

    let nextChange = state.change().removeNodeByKey(node.key)
    nextChange = nextChange[target.isAtStart ? 'collapseToStartOf' : 'collapseToEndOf'](target.node)
      .insertBlock(node)
      .collapseToEndOf(node)
      .focus()

    editor.onChange(nextChange)

    this.resetDropTarget()

  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  getValue() {
    return this.props.node.data.get('value')
  }

  handleEditStart = () => {
    this.props.onFocus([{_key: this.getValue()._key}, PathUtils.FIRST_META_KEY])
  }

  handleEditStop = () => {
    this.props.onFocus([{_key: this.getValue()._key}])
  }

  handleClose = () => {
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
      <div onClick={this.handleEditStart}>
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
    const {focusPath, onFocus, onBlur} = this.props
    const value = this.getValue()
    const memberType = this.getMemberTypeOf(value)

    const content = (
      <FormBuilderInput
        type={memberType}
        level={0}
        value={value}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onBlur={onBlur}
        focusPath={focusPath}
        path={[{_key: value._key}]}
      />
    )

    return (
      <EditBlockWrapper onClose={this.handleEditStop} key={value._key}>
        {content}
      </EditBlockWrapper>
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
    const {attributes, node, editor, focusPath} = this.props

    const value = this.getValue()

    const isFocused = editor.props.blockEditor.props.value.selection.hasFocusIn(node)

    const isEditing = PathUtils.isExpanded(value, focusPath || [])

    let className
    if (isFocused && !this.state.isSelected) {
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
        onDragEnter={this.handleCancelEvent}
        onDragLeave={this.handleCancelEvent}
        onDrop={this.handleCancelEvent}
        draggable
        onClick={this.handleToggleEdit}
        ref={this.refFormBuilderBlock}
        className={className}
      >
        <span
          ref={this.refPreview}
          className={styles.previewContainer}
        >
          {this.renderPreview()}
        </span>

        {isEditing && this.renderInput()}
      </div>
    )
  }
}
