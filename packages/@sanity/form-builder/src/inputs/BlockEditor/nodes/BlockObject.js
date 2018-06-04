// @flow
import type {BlockContentFeatures, SlateValue, Type, SlateChange, Marker} from '../typeDefs'
import type {Node} from 'react'
import ReactDOM from 'react-dom'
import Base64 from 'slate-base64-serializer'

import React from 'react'
import {Block} from 'slate'
import {Editor, findDOMNode, findNode, setEventTransfer} from 'slate-react'

import {IntentLink} from 'part:@sanity/base/router'
import LinkIcon from 'part:@sanity/base/link-icon'
import MarkerWrapper from 'part:@sanity/form-builder/input/block-editor/block-marker-wrapper'
import ValidationStatus from 'part:@sanity/components/validation/status'

import {PatchEvent} from '../../../PatchEvent'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import {resolveTypeName} from '../../../utils/resolveTypeName'

import createRange from '../utils/createRange'
import InvalidValue from '../../InvalidValueInput'
import Preview from '../../../Preview'
import ConfirmButton from '../ConfirmButton'
import EditButton from '../EditButton'

import styles from './styles/BlockObject.css'

type Props = {
  attributes: {},
  blockContentFeatures: BlockContentFeatures,
  children: Node,
  editor: Editor,
  editorValue: SlateValue,
  hasFormBuilderFocus: boolean,
  isSelected: boolean,
  markers: Marker[],
  node: Block,
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  onHideBlockDragMarker: void => void,
  onPatch: (event: PatchEvent) => void,
  onShowBlockDragMarker: (pos: string, node: HTMLDivElement) => void,
  readOnly: ?boolean,
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
    const {readOnly} = this.props
    if (readOnly) {
      return
    }
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

    const {onChange, node, editorValue} = this.props

    const target = this._dropTarget

    // Return if this is our node
    if (!target || target.node.key === node.key) {
      this.resetDropTarget()
      return
    }

    let nextChange = editorValue.change().removeNodeByKey(node.key)
    nextChange = nextChange[target.isAtStart ? 'collapseToStartOf' : 'collapseToEndOf'](target.node)
      .insertBlock(node)
      .collapseToEndOf(node)
      .focus()

    onChange(nextChange)

    this.resetDropTarget()
  }

  handleCancelEvent = event => {
    event.preventDefault()
    event.stopPropagation()
  }

  handleEditStart = event => {
    event.stopPropagation()
    const {node, onFocus, onChange, editorValue} = this.props
    const change = editorValue
      .change()
      .collapseToEndOf(node)
      .focus()
      .blur()
    onChange(change, () => onFocus([{_key: node.key}, FOCUS_TERMINATOR]))
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

  handleInvalidValue = (event: PatchEvent) => {
    const {onPatch} = this.props
    const value = this.getValue()
    onPatch(event.prefixAll({_key: value._key}), value)
  }

  handleRemoveValue = event => {
    const {editorValue, node, onChange} = this.props
    const change = editorValue.change()
    onChange(change.removeNodeByKey(node.key).focus())
  }

  renderPreview() {
    const {type, markers, readOnly, blockContentFeatures} = this.props
    const value = this.getValue()
    const valueType = resolveTypeName(value)
    const validTypes = blockContentFeatures.types.blockObjects
      .map(objType => objType.name)
      .concat('block')

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
        <Preview type={type} value={value} layout="block" />
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
            {!readOnly && <EditButton title="Edit this block" onClick={this.handleEditStart} />}
            {!readOnly && (
              <ConfirmButton title="Remove this block" onConfirm={this.handleRemoveValue} />
            )}
          </div>
        )}
      </div>
    )
  }

  render() {
    const {attributes, node, editorValue, isSelected, readOnly, markers} = this.props
    const isFocused = editorValue.selection.hasFocusIn(node)

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
      <MarkerWrapper markers={markers}>
        <div
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
          <div ref={this.refPreview} className={styles.previewContainer}>
            {this.renderPreview()}
          </div>
        </div>
      </MarkerWrapper>
    )
  }
}
