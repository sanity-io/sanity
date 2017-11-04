import PropTypes from 'prop-types'
import React from 'react'
import {get} from 'lodash'
import ReactDOM from 'react-dom'
import OffsetKey from 'slate-react/lib/utils/offset-key'
import setTransferData from 'slate-react/lib/utils/set-transfer-data'
import TRANSFER_TYPES from 'slate-react/lib/constants/transfer-types'
import Base64 from 'slate-base64-serializer'
import {findDOMNode} from 'slate-react'
import ItemForm from './ItemForm'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import Preview from '../../Preview'
import styles from './styles/FormBuilderBlock.css'
import createRange from './util/createRange'
import {applyAll} from '../../simplePatch'
import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValue from '../InvalidValue'

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
    const {node, editor} = this.props
    const change = editor.getState()
      .change()
      .setNodeByKey(node.key, {
        data: {value: applyAll(node.data.get('value'), event.patches)}
      })
    editor.onChange(change)
  }

  handleInvalidValueChange = event => {
    // the setimeout is a workaround because there seems to be a race condition with clicks and state updates
    setTimeout(() => {
      const {node, editor} = this.props

      const nextValue = applyAll(node.data.get('value'), event.patches)
      const change = editor.getState().change()
      const nextChange = (nextValue === undefined)
        ? change.removeNodeByKey(node.key)
        : change.setNodeByKey(node.key, {
          data: {value: nextValue}
        })

      editor.onChange(nextChange)
    }, 0)
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
      <Preview
        type={memberType}
        value={this.getValue()}
        layout="block"
      />
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

    const fieldsQty = ((memberType && memberType.fields) || []).length

    let editModalLayout = get(this, 'props.type.options.editModal')

    // Choose editModal based on number of fields
    if (!editModalLayout) {
      if (fieldsQty < 3) {
        editModalLayout = 'popover'
      } else {
        editModalLayout = 'fullscreen'
      }
    }

    if (editModalLayout === 'fullscreen') {
      return (
        <FullscreenDialog
          isOpen
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
        </FullscreenDialog>
      )
    }

    if (editModalLayout === 'fold') {
      return (
        <div className={styles.editBlockContainerFold}>
          <EditItemFold
            isOpen
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
          </EditItemFold>
        </div>
      )
    }

    // default
    return (
      <div className={styles.editBlockContainerPopOver}>
        <EditItemPopOver
          isOpen
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
      </div>
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
    const {attributes, node, editor} = this.props
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
