// @flow
import type {Node} from 'react'
import ReactDOM from 'react-dom'
import Base64 from 'slate-base64-serializer'

import React, {Fragment} from 'react'
import classNames from 'classnames'

import {IntentLink} from 'part:@sanity/base/router'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import LinkIcon from 'part:@sanity/base/link-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'

import type {
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  Path,
  RenderCustomMarkers,
  SlateEditor,
  SlateNode,
  Type
} from '../typeDefs'

import {PatchEvent} from '../../../PatchEvent'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'
import {resolveTypeName} from '../../../utils/resolveTypeName'

import InvalidValue from '../../InvalidValueInput'
import Preview from '../../../Preview'

import styles from './styles/BlockObject.css'

import {findDOMNode, findNode, setEventTransfer} from 'slate-react'
import {Block} from 'slate'

type Props = {
  attributes: any,
  blockContentFeatures: BlockContentFeatures,
  editor: SlateEditor,
  hasFormBuilderFocus: boolean,
  isSelected?: boolean,
  markers: Marker[],
  node: Block,
  onFocus: Path => void,
  onHideBlockDragMarker: void => void,
  onPatch: (event: PatchEvent, value?: FormBuilderValue[]) => void,
  onShowBlockDragMarker: (pos: string, node: HTMLDivElement) => void,
  readOnly: ?boolean,
  blockActions?: Node,
  renderCustomMarkers?: RenderCustomMarkers,
  type: ?Type
}

type State = {
  isDragging: boolean
}

export default class BlockObject extends React.Component<Props, State> {
  _dropTarget: ?{node: SlateNode, position: string}
  _editorNode: ?HTMLElement = null
  _dragGhost: ?HTMLElement = null
  previewContainer: ?HTMLDivElement

  static defaultProps = {
    blockActions: null,
    renderCustomMarkers: null,
    isSelected: false
  }

  state = {
    isDragging: false
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
    this.setState({isDragging: true})
    this.addDragHandlers()
    const encoded = Base64.serializeNode(node, {preserveKeys: true, preserveData: true})
    setEventTransfer(event, 'node', encoded)
    event.dataTransfer.effectAllowed = 'move'
    // Specify dragImage so that single elements in the preview will not be the drag image,
    // but always the whole block thing itself.
    // Also clone it so that it will not be visually clipped by scroll-containers etc.
    const element = event.currentTarget
    if (element) {
      this._dragGhost = element.cloneNode(true)
      this._dragGhost.style.width = `${element.clientWidth}px`
      this._dragGhost.style.height = `${element.clientHeight}px`
      this._dragGhost.style.position = 'absolute'
      this._dragGhost.style.top = '-99999px'
      this._dragGhost.style.left = '-99999px'
      if (document.body) {
        document.body.appendChild(this._dragGhost)
        // eslint-disable-next-line max-depth
        if (this._dragGhost) {
          event.dataTransfer.setDragImage(this._dragGhost)
        }
      }
    }
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
      if (!this.state.isDragging) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const {node} = this.props
      let targetDOMNode
      if (event.target instanceof HTMLElement) {
        const keyNodes = event.target.querySelectorAll('[data-key]')
        targetDOMNode = keyNodes.item(0)
      }

      // As the event is registered on the editor parent node
      // ignore the event if it is coming from from the editor node itself
      if (!targetDOMNode || targetDOMNode === this._editorNode) {
        this.resetDropTarget()
        return
      }

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
      }

      const {editor} = this.props

      const targetNode = findNode(targetDOMNode, editor)
      if (!targetNode) {
        this.resetDropTarget()
        return
      }

      const block =
        targetNode.object === 'block'
          ? targetNode
          : editor.value.document.getClosestBlock(targetNode.key)

      // If no or same block reset and return
      if (!block || block.key === node.key) {
        this.resetDropTarget()
        return
      }
      const blockDOMNode = findDOMNode(block)
      const rect = blockDOMNode.getBoundingClientRect()
      const position = event.clientY < rect.top + blockDOMNode.scrollHeight / 2 ? 'before' : 'after'

      // If the block in the nearest vincinity (same position target), reset and return
      let nearestNeighbour = false
      if (position === 'before') {
        const nextBlock = editor.value.document.getNextBlock(node.key)
        nearestNeighbour = nextBlock && nextBlock.key === block.key
      } else {
        const previousBlock = editor.value.document.getPreviousBlock(node.key)
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
    this.setState({isDragging: false})

    const target = this._dropTarget
    this.removeDragHandlers()
    this.resetDropTarget()
    // Remove the ghost
    if (this._dragGhost && this._dragGhost.parentNode) {
      this._dragGhost.parentNode.removeChild(this._dragGhost)
    }
    const {node, editor} = this.props

    // Return if this is our node
    if (!target || target.node.key === node.key) {
      return
    }
    editor
      .removeNodeByKey(node.key)
      [target.position === 'before' ? 'moveToStartOfNode' : 'moveToEndOfNode'](target.node)
      .insertBlock(node)
      .moveToEndOfNode(node)
      .focus()
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

  handleDoubleClick = (event: SyntheticMouseEvent<>) => {
    event.stopPropagation()
    this.handleEditStart()
  }

  handleEditStart = () => {
    const {node, onFocus, editor} = this.props
    editor
      .moveToEndOfNode(node)
      .focus()
      .blur()
    setTimeout(() => {
      onFocus([{_key: node.key}, FOCUS_TERMINATOR])
    }, 200)
  }

  handleClose = () => {
    const {node, onFocus} = this.props
    onFocus([{_key: node.key}])
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

  handleRemoveValue = () => {
    const {node, editor} = this.props
    editor.removeNodeByKey(node.key).focus()
  }

  handleHeaderMenuAction = (item, event) => {
    const {node, editor} = this.props
    if (item.name === 'delete') {
      editor.removeNodeByKey(node.key).focus()
    }

    if (item.name === 'edit') {
      this.handleEditStart()
    }
  }

  renderMenuItem = item => {
    const Icon = item.icon
    return (
      <div className={item.color ? styles.menuItem : styles.menuItemDanger}>
        {item.intent ? (
          <IntentLink intent={item.intent} params={item.params}>
            {Icon && <Icon />}
            {item.title}
          </IntentLink>
        ) : (
          <Fragment>
            {Icon && <Icon />}&nbsp;
            {item.title}
          </Fragment>
        )}
      </div>
    )
  }

  renderPreview = (value: FormBuilderValue) => {
    const {type, readOnly} = this.props
    const menuItems = []

    if (value._ref) {
      menuItems.push({
        title: 'Go to reference',
        icon: LinkIcon,
        intent: 'edit',
        params: {id: value._ref}
      })
    }
    if (readOnly) {
      menuItems.push({
        title: 'View',
        icon: VisibilityIcon,
        name: 'view'
      })
    } else {
      menuItems.push({
        title: 'Edit',
        icon: EditIcon,
        name: 'edit'
      })
      menuItems.push({
        title: 'Delete',
        name: 'delete',
        icon: TrashIcon,
        color: 'danger'
      })
    }
    return (
      <div className={styles.preview}>
        <Preview type={type} value={value} layout="block" />
        <div className={styles.header}>
          <div className={styles.type}>{type ? type.title || type.name : 'Unknown'}</div>
          <div align="end" className={styles.functions}>
            <DropDownButton
              title="Show menu"
              placement="bottom-end"
              kind="simple"
              showArrow={false}
              icon={IconMoreVert}
              items={menuItems}
              onAction={this.handleHeaderMenuAction}
              onClose={this.handleHeaderMenuClose}
              onClickOutside={this.handleHeaderMenuClose}
              renderItem={this.renderMenuItem}
            />
          </div>
        </div>
      </div>
    )
  }

  render() {
    const {
      attributes,
      blockContentFeatures,
      editor,
      isSelected,
      markers,
      node,
      onFocus,
      readOnly,
      blockActions,
      renderCustomMarkers
    } = this.props
    const {isDragging} = this.state
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
      editor.value.selection.focus.isInNode(node) && styles.focused,
      isSelected && styles.selected,
      errors.length > 0 && styles.hasErrors,
      isDragging && styles.isDragging
    ])
    return (
      <div {...attributes}>
        <div
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          onDragEnter={this.handleCancelEvent}
          onDragLeave={this.handleCancelEvent}
          onDrop={this.handleCancelEvent}
          onDoubleClick={this.handleDoubleClick}
          draggable={!readOnly}
          className={classname}
        >
          <div ref={this.refPreview} className={styles.previewContainer}>
            {this.renderPreview(value)}
          </div>
        </div>
        {(markers.length > 0 || blockActions) && (
          <BlockExtras
            block={value}
            blockActions={blockActions}
            editor={editor}
            markers={markers}
            onFocus={onFocus}
            renderCustomMarkers={renderCustomMarkers}
          />
        )}
      </div>
    )
  }
}
