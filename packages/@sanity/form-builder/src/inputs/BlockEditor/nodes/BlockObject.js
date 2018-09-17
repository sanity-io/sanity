// @flow
import type {Node} from 'react'
import ReactDOM from 'react-dom'
import Base64 from 'slate-base64-serializer'

import React from 'react'
import {Block} from 'slate'
import {throttle} from 'lodash'
import {Editor, findDOMNode, findNode, setEventTransfer} from 'slate-react'
import classNames from 'classnames'

import {IntentLink} from 'part:@sanity/base/router'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import LinkIcon from 'part:@sanity/base/link-icon'
import ButtonsCollection from 'part:@sanity/components/buttons/button-collection'

import type {
  BlockContentFeatures,
  SlateValue,
  FormBuilderValue,
  Type,
  SlateChange,
  Marker,
  Path,
  SlateNode
} from '../typeDefs'

import {PatchEvent} from '../../../PatchEvent'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import {resolveTypeName} from '../../../utils/resolveTypeName'

import InvalidValue from '../../InvalidValueInput'
import Preview from '../../../Preview'
import DeleteButton from '../DeleteButton'
import EditButton from '../EditButton'
import ViewButton from '../ViewButton'

import styles from './styles/BlockObject.css'

type Props = {
  attributes: any,
  blockContentFeatures: BlockContentFeatures,
  editor: Editor,
  editorValue: SlateValue,
  hasFormBuilderFocus: boolean,
  isSelected?: boolean,
  markers: Marker[],
  node: Block,
  onChange: (change: SlateChange, callback?: (SlateChange) => void) => void,
  onFocus: Path => void,
  onHideBlockDragMarker: void => void,
  onPatch: (event: PatchEvent, value?: FormBuilderValue[]) => void,
  onShowBlockDragMarker: (pos: string, node: HTMLDivElement) => void,
  readOnly: ?boolean,
  blockActions?: Node,
  renderCustomMarkers?: (Marker[]) => Node,
  type: ?Type
}

export default class BlockObject extends React.Component<Props> {
  formBuilderBlock: ?HTMLDivElement
  _dropTarget: ?{node: SlateNode, position: string}
  _editorNode: ?HTMLElement = null
  _isDragging: boolean = false
  previewContainer: ?HTMLDivElement

  static defaultProps = {
    blockActions: null,
    renderCustomMarkers: null,
    isSelected: false
  }

  componentDidMount() {
    const {editor} = this.props
    const elm = ReactDOM.findDOMNode(editor) // eslint-disable-line react/no-find-dom-node
    if (elm instanceof HTMLElement) {
      this._editorNode = elm
    }
  }

  componentWillUnmount() {
    this.removeDragHandlers()
  }

  addDragHandlers() {
    const {readOnly} = this.props
    if (readOnly) {
      return
    }
    if (this._editorNode) {
      this._editorNode.addEventListener('dragover', this.handleDragOverOtherNode)
    }
    if (this._editorNode) {
      this._editorNode.addEventListener('dragleave', this.handleDragLeave)
    }
  }

  removeDragHandlers() {
    if (this._editorNode) {
      this._editorNode.removeEventListener('dragover', this.handleDragOverOtherNode)
    }
    if (this._editorNode) {
      this._editorNode.removeEventListener('dragleave', this.handleDragLeave)
    }
  }

  handleDragStart = (event: SyntheticDragEvent<HTMLElement>) => {
    const {node} = this.props
    this._isDragging = true
    this.addDragHandlers()
    // const element = ReactDOM.findDOMNode(this.previewContainer)
    const encoded = Base64.serializeNode(node, {preserveKeys: true})
    setEventTransfer(event, 'node', encoded)
    event.dataTransfer.effectAllowed = 'move'
    // const element = event.currentTarget
    // event.dataTransfer.setDragImage(element, element.clientWidth / 2, element.clientHeight / 2)
  }

  // Remove the drop target if we leave the editors nodes
  handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    this.resetDropTarget()
  }

  resetDropTarget() {
    this._dropTarget = null
    this.props.onHideBlockDragMarker()
  }

  handleDragOverOtherNode =
    // eslint-disable-next-line complexity
    (event: DragEvent) => {
      event.preventDefault()
      if (!this._isDragging) {
        return
      }

      const {node} = this.props

      const targetDOMNode = event.target // Must not be currentTarget!

      // As the event is registered on the editor parent node
      // ignore the event if it is coming from from the editor node itself
      if (
        targetDOMNode === this._editorNode ||
        (targetDOMNode instanceof HTMLElement && !targetDOMNode.getAttribute('data-key'))
      ) {
        this.resetDropTarget()
        return
      }

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
      }

      const {editorValue} = this.props

      const targetNode = findNode(targetDOMNode, editorValue)
      if (!targetNode) {
        this.resetDropTarget()
        return
      }

      const block =
        targetNode.object === 'block'
          ? targetNode
          : editorValue.document.getClosestBlock(targetNode.key)

      // If no or same block reset and return
      if (!block || block.key === node.key) {
        this.resetDropTarget()
        return
      }

      const blockDOMNode = findDOMNode(block)
      const rect = blockDOMNode.getBoundingClientRect()
      const position = event.clientY < rect.top + blockDOMNode.clientHeight / 2 ? 'before' : 'after'

      // If the block in the nearest vincinity (same position target), reset and return
      let nearestNeighbour = false
      if (position === 'before') {
        const nextBlock = editorValue.document.getNextBlock(node.key)
        nearestNeighbour = nextBlock && nextBlock.key === block.key
      } else {
        const previousBlock = editorValue.document.getPreviousBlock(node.key)
        nearestNeighbour = previousBlock && previousBlock.key === block.key
      }
      if (nearestNeighbour) {
        this.resetDropTarget()
        return
      }

      this.props.onShowBlockDragMarker(position, blockDOMNode)

      this._dropTarget = {node: block, position}
    }

  handleDragEnd = (event: SyntheticDragEvent<>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    this._isDragging = false

    const target = this._dropTarget
    this.removeDragHandlers()
    this.resetDropTarget()

    const {onChange, node, editorValue} = this.props

    // Return if this is our node
    if (!target || target.node.key === node.key) {
      return
    }
    let nextChange = editorValue.change().removeNodeByKey(node.key)
    nextChange = nextChange[target.position === 'before' ? 'moveToStartOfNode' : 'moveToEndOfNode'](
      target.node
    )
      .insertBlock(node)
      .moveToEndOfNode(node)
      .focus()
    onChange(nextChange)
  }

  handleCancelEvent = (event: SyntheticEvent<>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  handleFocus = (event: SyntheticMouseEvent<>) => {
    event.stopPropagation()
    const {node, onFocus} = this.props
    onFocus([{_key: node.key}, FOCUS_TERMINATOR])
  }

  handleEditStart = (event: SyntheticMouseEvent<>) => {
    event.stopPropagation()
    const {node, onFocus, onChange, editorValue} = this.props
    const change = editorValue
      .change()
      .moveToEndOfNode(node)
      .focus()
      .blur()
    onChange(change, () => onFocus([{_key: node.key}, FOCUS_TERMINATOR]))
  }

  handleClose = () => {
    const {node, onFocus} = this.props
    onFocus([{_key: node.key}])
  }

  refFormBuilderBlock = (formBuilderBlock: ?HTMLDivElement) => {
    this.formBuilderBlock = formBuilderBlock
  }

  refPreview = (previewContainer: ?HTMLDivElement) => {
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

  handleRemoveValue = (event: SyntheticMouseEvent<>) => {
    event.preventDefault()
    event.stopPropagation()
    const {editorValue, node, onChange} = this.props
    const change = editorValue.change()
    onChange(change.removeNodeByKey(node.key).focus())
  }

  renderPreview(value: FormBuilderValue) {
    const {type, readOnly} = this.props
    return (
      <div className={styles.preview}>
        <Preview type={type} value={value} layout="block" />
        <div className={styles.header}>
          <div className={styles.type}>{type ? type.title || type.name : 'Unknown'}</div>
          <ButtonsCollection align="end" className={styles.functions}>
            {value._ref && (
              <IntentLink
                className={styles.linkToReference}
                intent="edit"
                params={{id: value._ref}}
              >
                <LinkIcon />
              </IntentLink>
            )}
            {readOnly ? (
              <div>
                <ViewButton title="View this block" onClick={this.handleFocus} />
              </div>
            ) : (
              <div>
                <EditButton title="Edit this block" onClick={this.handleEditStart} />
              </div>
            )}
            {!readOnly && (
              <div>
                <DeleteButton title="Remove this block" onClick={this.handleRemoveValue} />
              </div>
            )}
          </ButtonsCollection>
        </div>
      </div>
    )
  }

  render() {
    const {
      attributes,
      blockContentFeatures,
      editorValue,
      isSelected,
      markers,
      node,
      onChange,
      onFocus,
      readOnly,
      blockActions,
      renderCustomMarkers
    } = this.props
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

    const classname = classNames([
      styles.root,
      editorValue.selection.focus.isInNode(node) && styles.focused,
      isSelected && styles.selected,
      errors.length > 0 && styles.hasErrors
    ])
    return (
      <div {...attributes}>
        <div
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          onDragEnter={this.handleCancelEvent}
          onDragLeave={this.handleCancelEvent}
          onDrop={this.handleCancelEvent}
          onDoubleClick={this.handleEditStart}
          draggable={!readOnly}
          ref={this.refFormBuilderBlock}
          className={classname}
        >
          <div ref={this.refPreview} className={styles.previewContainer}>
            {this.renderPreview(value)}
          </div>
        </div>
        {(markers.length > 0 || blockActions) && (
          <BlockExtras
            markers={markers}
            onFocus={onFocus}
            onChange={onChange}
            editorValue={editorValue}
            block={value}
            blockActions={blockActions}
            renderCustomMarkers={renderCustomMarkers}
          />
        )}
      </div>
    )
  }
}
