// @flow
import type {BlockContentFeatures, SlateValue, Type, SlateChange, Marker} from '../typeDefs'
import type {Node} from 'react'
import ReactDOM from 'react-dom'
import Base64 from 'slate-base64-serializer'

import React from 'react'
import {Block, Range} from 'slate'
import {Editor, setEventTransfer, getEventRange} from 'slate-react'
import {IntentLink} from 'part:@sanity/base/router'
import LinkIcon from 'part:@sanity/base/link-icon'
import ValidationStatus from 'part:@sanity/components/validation/status'

import {resolveTypeName} from '../../../utils/resolveTypeName'
import {PatchEvent} from '../../../PatchEvent'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'

import InvalidValue from '../../InvalidValueInput'
import Preview from '../../../Preview'
import ConfirmButton from '../ConfirmButton'
import EditButton from '../EditButton'

import styles from './styles/InlineObject.css'

type Props = {
  attributes: {},
  blockContentFeatures: BlockContentFeatures,
  children: Node,
  editor: Editor,
  editorIsFocused: boolean,
  editorValue: SlateValue,
  hasFormBuilderFocus: boolean,
  isSelected: boolean,
  markers: Marker[],
  node: Block,
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  onPatch: (event: PatchEvent) => void,
  readOnly?: boolean,
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

  handleInvalidValue = (event: PatchEvent) => {
    let _event = event
    const {editorValue, onPatch} = this.props
    const {focusBlock} = editorValue
    const value = this.getValue()
    const path = [{_key: focusBlock.key}, 'children', {_key: value._key}]
    path.reverse().forEach(part => {
      _event = _event.prefixAll(part)
    })
    onPatch(_event, value)
  }

  handleRemoveValue = () => {
    const {editorValue, node, onChange} = this.props
    const change = editorValue.change()
    onChange(change.removeNodeByKey(node.key).focus())
  }

  handleCancelEvent = event => {
    event.stopPropagation()
    event.preventDefault()
  }

  handleEditStart = event => {
    event.stopPropagation()
    const {node, onFocus, onChange, editorValue} = this.props
    const {focusBlock} = editorValue
    const change = editorValue.change().collapseToEndOf(node)
    onChange(change, () =>
      onFocus([{_key: focusBlock.key}, 'children', {_key: node.key}, FOCUS_TERMINATOR])
    )
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
    const {type, markers, readOnly, blockContentFeatures} = this.props
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
    const scopedValidation = validation.map(marker => {
      if (marker.path.length <= 1) {
        return marker
      }

      const level = marker.level === 'error' ? 'errors' : 'warnings'
      return Object.assign({}, marker, {
        item: marker.item.cloneWithMessage(`Contains ${level}`)
      })
    })
    return (
      <div className={errors.length > 0 ? styles.innerWithError : styles.inner}>
        <Preview type={type} value={value} layout="inline" />
        {!readOnly && (
          <div className={styles.functions}>
            <div className={styles.validationStatus}>
              <ValidationStatus markers={scopedValidation} />
            </div>
            {value._ref && (
              <IntentLink
                className={styles.linkToReference}
                intent="edit"
                params={{id: value._ref}}
              >
                <LinkIcon />
              </IntentLink>
            )}
            {!readOnly && <EditButton title="Edit this object" onClick={this.handleEditStart} />}
            {!readOnly && (
              <ConfirmButton title="Remove this object" onConfirm={this.handleRemoveValue} />
            )}
          </div>
        )}
      </div>
    )
  }

  render() {
    const {attributes, node, editorValue, editorIsFocused, isSelected, readOnly} = this.props
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
        draggable={!readOnly}
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
