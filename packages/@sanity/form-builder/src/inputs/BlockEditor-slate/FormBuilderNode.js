import React, {PropTypes} from 'react'

import ReactDOM from 'react-dom'
import {get} from 'lodash'
import OffsetKey from 'slate/lib/utils/offset-key'
import {findDOMNode} from 'slate'
import ItemForm from './ItemForm'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import Preview from '../../Preview'
import applySanityPatch from './applySanityPatch'
import styles from './styles/FormBuilderNode.css'
import createRange from './util/createRange'

export default class PreviewNode extends React.Component {
  static propTypes = {
    type: PropTypes.object,
    node: PropTypes.object,
    editor: PropTypes.object,
    state: PropTypes.object,
    attributes: PropTypes.object
  }

  state = {isFocused: false, isEditing: false, isDragging: false}
  _dropTarget = null
  _editorNode = null

  constructor(props) {
    super(props)
    this._isInline = props.type.options && props.type.options.inline
  }

  componentWillUpdate(nextProps) {
    const {node} = this.props
    const selection = nextProps.state.selection
    if (selection !== this.props.state.selection) {
      const isFocused = selection.hasFocusIn(node)
      this.setState({isFocused: isFocused})
    }
  }

  handleChange = event => {
    const {node, editor} = this.props
    const next = editor.getState()
      .transform()
      .setNodeByKey(node.key, {
        data: {value: applySanityPatch(node.data.get('value'), event.patch)}
      })
      .apply()

    editor.onChange(next)
  }

  handleDragStart = event => {
    const {editor} = this.props
    this.setState({isDragging: true})
    event.dataTransfer.effectAllowed = 'none'
    event.dataTransfer.setData('text/plain', '')
    this._editorNode = ReactDOM.findDOMNode(editor)
    this.addDragHandlers()
  }

  addDragHandlers() {
    this._editorNode.addEventListener('dragover', this.handleDragOverOtherNode)
    this._editorNode.addEventListener('dragleave', this.handleDragLeave)
  }

  removeDragHandlers() {
    this._editorNode.addEventListener('dragover', this.handleDragOverOtherNode)
    this._editorNode.addEventListener('dragleave', this.handleDragLeave)
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

    const {state} = this.props
    const {document} = state
    const {rangeIsAtStart, rangeOffset} = createRange(event)

    let node
    if (this._isInline) {
      node = document.getClosestInline(key)
    } else {
      node = document.getClosestBlock(key)
    }

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

    const {editor, state, node} = this.props
    const target = this._dropTarget

    // Return if this is our node
    if (!target || target.node === node) {
      return
    }

    let next = state.transform().removeNodeByKey(node.key)

    if (this._isInline) {
      next = this.applyDropTargetInline(next, target)
    } else {
      next = this.applyDropTargetBlock(next, target)
    }

    this.resetDropTarget()

    // Move cursor and apply
    next = next.collapseToEndOf(node)
      .focus()
      .apply()

    editor.onChange(next)
  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  applyDropTargetInline(transform, target) {
    const {node} = this.props
    let next = transform

    if (target.isAtStart) {
      next = next.collapseToStartOf(target.node)
    } else {
      next = next.collapseToEndOf(target.node)
    }
    return next
      .moveToOffsets(target.offset)
      .insertInline(node)
  }

  applyDropTargetBlock(transform, target) {
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

  renderPreview() {
    const {type} = this.props
    return (
      <Preview
        type={type}
        value={this.getValue().serialize()}
        layout={this._isInline ? 'inline' : 'block'}
      />
    )
  }

  renderInput() {
    const {type} = this.props
    return (
      <EditItemPopOver
        title={this.props.node.title}
        onClose={this.handleClose}
      >
        <ItemForm
          onDrop={this.handleCancelEvent}
          type={type}
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
    const NodeTag = this._isInline ? 'span' : 'div'

    const className = this.state.isFocused ? styles.active : styles.root

    return (
      <NodeTag
        {...attributes}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onDragOver={this.handleDragOver}
        draggable
        className={className}
      >
        <span className={styles.previewContainer} onClick={this.handleToggleEdit}>
          {this.renderPreview()}
        </span>

        {isEditing && (
          <div className={styles.editBlockContainer}>
            {this.renderInput()}
          </div>
        )}
      </NodeTag>
    )
  }
}
