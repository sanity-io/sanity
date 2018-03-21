// @flow
import type {BlockContentFeatures, SlateValue, Type, SlateChange} from '../typeDefs'
import type {Node} from 'react'
import ReactDOM from 'react-dom'
import Base64 from 'slate-base64-serializer'

import React from 'react'
import {Block} from 'slate'
import {Editor, findDOMNode, findNode, setEventTransfer} from 'slate-react'

import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'

import createRange from '../utils/createRange'
import InvalidValue from '../../InvalidValueInput'
import Preview from '../../../Preview'

import styles from './styles/BlockObject.css'

type Props = {
  attributes: {},
  blockContentFeatures: BlockContentFeatures,
  children: Node,
  editorValue: SlateValue,
  node: Block,
  editor: Editor,
  editorIsFocused: boolean,
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  onPatch: (event: PatchEvent) => void,
  onShowBlockDragMarker: (pos: string, node: HTMLDivElement) => void,
  onHideBlockDragMarker: void => void,
  isSelected: boolean,
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

  handleCancelEvent = event => {
    event.preventDefault()
  }

  handleEditStart = () => {
    const {node, onFocus} = this.props
    onFocus([{_key: node.key}, FOCUS_TERMINATOR])
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
      <div
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
      </div>
    )
  }
}
