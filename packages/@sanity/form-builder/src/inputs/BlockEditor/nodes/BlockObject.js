// @flow
import type {BlockContentFeatures, SlateValue, Type, SlateChange} from '../typeDefs'
import type {Node} from 'react'
import ReactDOM from 'react-dom'
import Base64 from 'slate-base64-serializer'

import React from 'react'
import {Block} from 'slate'
import {Editor, findDOMNode, findNode, setEventTransfer} from 'slate-react'
import {get} from 'lodash'

// import PatchEvent from '../../../PatchEvent'
// import {applyAll} from '../../../simplePatch'

import DefaultDialog from 'part:@sanity/components/dialogs/default'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Popover from 'part:@sanity/components/dialogs/popover'

import {FormBuilderInput} from '../../../FormBuilderInput'
import createRange from '../utils/createRange'
import FocusManager from '../../../sanity/focusManagers/SimpleFocusManager'
import InvalidValue from '../../InvalidValueInput'
import Preview from '../../../Preview'
import StopPropagation from '../StopPropagation'

import styles from './styles/BlockObject.css'

const DIALOG_ACTIONS = [
  {
    index: '1',
    name: 'close',
    title: 'Close'
  }
]

type Props = {
  attributes: {},
  blockContentFeatures: BlockContentFeatures,
  children: Node,
  editorValue: SlateValue,
  node: Block,
  editor: Editor,
  onChange: (change: SlateChange) => void,
  onFormBuilderInputBlur: (nextPath: []) => void,
  onFormBuilderInputFocus: (nextPath: []) => void,
  onPatch: (event: PatchEvent) => void,
  onShowBlockDragMarker: (pos: string, node: HTMLDivElement) => void,
  onHideBlockDragMarker: void => void,
  type: ?Type
}

type State = {
  isDragging: boolean,
  isEditing: boolean,
  isSelected: boolean
}

export default class BlockObject extends React.Component<Props, State> {
  rootElement: ?HTMLDivElement = null

  state = {
    isSelected: false,
    isEditing: false,
    isDragging: false
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
    const {node, editor} = this.props
    this._editorNode = ReactDOM.findDOMNode(editor)
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
    this.props.onHideBlockDragMarker()
    if (event.target === this._editorNode) {
      this.resetDropTarget()
    }
  }

  resetDropTarget() {
    this._dropTarget = null
    this.props.onHideBlockDragMarker()
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

    const {editorValue} = this.props

    const targetNode = findNode(targetDOMNode, editorValue)
    if (!targetNode) {
      return
    }

    const block =
      targetNode.object === 'block'
        ? targetNode
        : editorValue.document.getClosestBlock(targetNode.key)

    if (!block || block.key === this.props.node.key) {
      this.resetDropTarget()
      return
    }

    const range = createRange(event)

    if (range === null) {
      return
    }

    const {rangeIsAtStart, rangeOffset} = range

    const domNode = findDOMNode(block) // eslint-disable-line react/no-find-dom-node

    if (rangeIsAtStart) {
      this.props.onShowBlockDragMarker('before', domNode)
    } else {
      this.props.onShowBlockDragMarker('after', domNode)
    }
    this._dropTarget = {node: block, isAtStart: rangeIsAtStart, offset: rangeOffset}
  }

  handleDragEnd = event => {
    this.setState({isDragging: false})
    this.removeDragHandlers()

    const {editor, node, editorValue} = this.props

    const target = this._dropTarget

    // Return if this is our node
    if (!target || target.node === node) {
      this.resetDropTarget()
      return
    }

    let nextChange = editorValue.change().removeNodeByKey(node.key)
    nextChange = nextChange[target.isAtStart ? 'collapseToStartOf' : 'collapseToEndOf'](target.node)
      .insertBlock(node)
      .collapseToEndOf(node)
      .focus()

    editor.onChange(nextChange)

    this.resetDropTarget()
  }

  handleDialogAction = action => {
    if (action.name === 'close') {
      this.handleClose()
    }
  }

  handleChange = event => {
    const {node, onPatch} = this.props
    onPatch(event.prefixAll({_key: node.key}))
  }

  handleToggleEdit = () => {
    this.setState({isEditing: true})
  }

  handleClose = () => {
    this.setState({isEditing: false})
  }

  handleCancelEvent = event => {
    event.preventDefault()
  }

  getValue() {
    return this.props.node.data.get('value')
  }

  refFormBuilderBlock = formBuilderBlock => {
    this.formBuilderBlock = formBuilderBlock
  }

  refPreview = previewContainer => {
    this.previewContainer = previewContainer
  }

  renderInput() {
    const {type} = this.props

    const fieldsQty = ((type && type.fields) || []).length

    let editModalLayout = get(this, 'props.type.options.editModal')

    // Choose editModal based on number of fields
    if (!editModalLayout) {
      if (fieldsQty < 3) {
        editModalLayout = 'popover'
      } else {
        editModalLayout = 'fullscreen'
      }
    }

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
            isOpen
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

  renderFormBuilderInput = ({onFocus, onBlur, focusPath}) => {
    const {type} = this.props
    const value = this.getValue()

    return (
      <FormBuilderInput
        type={type}
        level={0}
        value={value}
        onChange={this.handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        focusPath={focusPath}
        path={[{_key: value._key}]}
      />
    )
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
    const {isEditing} = this.state
    const {attributes, node, editorValue} = this.props
    const isFocused = editorValue.selection.hasFocusIn(node)

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
        <span ref={this.refPreview} className={styles.previewContainer}>
          {this.renderPreview()}
        </span>

        {isEditing && <StopPropagation>{this.renderInput()}</StopPropagation>}
      </div>
    )
  }
}
