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
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Button from 'part:@sanity/components/buttons/default'
import Popover from 'part:@sanity/components/dialogs/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import Preview from '../../Preview'
import styles from './styles/FormBuilderBlock.css'
import createRange from './util/createRange'
import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValue from '../InvalidValueInput'
import FocusManager from '../../sanity/focusManagers/SimpleFocusManager'
import EditIcon from 'part:@sanity/base/edit-icon'
import StopPropagation from './StopPropagation'

const DIALOG_ACTIONS = [
  {
    index: '1',
    name: 'close',
    title: 'Close'
  }
  // {
  //   index: '2',
  //   name: 'delete',
  //   kind: 'simple',
  //   title: 'Delete',
  //   color: 'danger',
  //   secondary: true
  // }
]

export default class FormBuilderBlock extends React.Component {
  static propTypes = {
    // Note: type refers to the array type, not the value type
    type: PropTypes.object.isRequired,
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
    const isSelected = selection.containsNode && selection.containsNode(this.formBuilderBlock)
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

    return <Preview type={memberType} value={this.getValue()} layout="block" />
  }

  handleDialogAction = action => {
    if (action.name === 'close') {
      this.handleClose()
    }
    if (action.name === 'delete') {
      // Implement delete
    }
  }

  refFormBuilderBlock = formBuilderBlock => {
    this.formBuilderBlock = formBuilderBlock
  }

  refPreview = previewContainer => {
    this.previewContainer = previewContainer
  }

  renderFormBuilderInput = ({onFocus, onBlur, focusPath}) => {
    const value = this.getValue()
    const memberType = this.getMemberTypeOf(value)

    return (
      <div style={{padding: '1rem'}}>
        <FormBuilderInput
          type={memberType}
          level={1}
          value={value}
          onChange={this.handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          focusPath={focusPath}
          path={[{_key: value._key}]}
        />
      </div>
    )
  }
  renderInput() {
    const editModalLayout = get(this.props.type.options, 'editModal')

    const input = <FocusManager>{this.renderFormBuilderInput}</FocusManager>

    if (editModalLayout === 'fullscreen') {
      return (
        <FullscreenDialog isOpen title={this.props.node.title} onClose={this.handleClose}>
          {input}
        </FullscreenDialog>
      )
    }

    if (editModalLayout === 'fold') {
      return (
        <div className={styles.editBlockContainerFold}>
          <EditItemFold isOpen title={this.props.node.title} onClose={this.handleClose}>
            {input}
          </EditItemFold>
        </div>
      )
    }

    if (editModalLayout === 'popover') {
      return (
        <div className={styles.editBlockContainerPopOver}>
          <Popover
            title={this.props.node.title}
            onClose={this.handleClose}
            onEscape={this.handleClose}
            onClickOutside={this.handleClose}
            onAction={this.handleDialogAction}
            actions={DIALOG_ACTIONS}
          >
            {input}
          </Popover>
        </div>
      )
    }
    return (
      <DefaultDialog
        isOpen
        title={this.props.node.title}
        onClose={this.handleClose}
        showCloseButton={false}
        onAction={this.handleDialogAction}
        actions={DIALOG_ACTIONS}
      >
        {input}
      </DefaultDialog>
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

    const value = this.getValue()
    const memberType = this.getMemberTypeOf(value)

    return (
      <div
        {...attributes}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onDragEnter={this.handleCancelEvent}
        onDragLeave={this.handleCancelEvent}
        onDrop={this.handleCancelEvent}
        draggable
        ref={this.refFormBuilderBlock}
        className={className}
      >
        <span
          ref={this.refPreview}
          className={styles.previewContainer}
          onClick={this.handleToggleEdit}
        >
          <div className={styles.preview}>{this.renderPreview()}</div>
          <div className={styles.functions}>
            {memberType && (
              <span className={styles.type}>{memberType.title || memberType.name}</span>
            )}
            <div>
              <Button kind="simple" icon={EditIcon} title="Delete" />
            </div>
            {/*
              Add delete button later when we have handleDelete here
              <div>
                <Button
                  kind="simple"
                  color="danger"
                  icon={TrashIcon}
                  title="Delete"
                />
              </div>
            */}
          </div>
        </span>

        {isEditing && <StopPropagation>{this.renderInput()}</StopPropagation>}
      </div>
    )
  }
}
