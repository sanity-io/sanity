// @flow
import type {
  Block,
  BlockContentFeatures,
  Marker,
  SlateChange,
  SlateComponentProps,
  SlateMarkProps,
  SlateValue,
  Type
} from './typeDefs'
import type {Node} from 'react'

import React from 'react'
import ReactDOM from 'react-dom'

import SoftBreakPlugin from 'slate-soft-break'
import {Editor as SlateEditor} from 'slate-react'
import {isEqual} from 'lodash'
import {EDITOR_DEFAULT_BLOCK_TYPE} from '@sanity/block-tools'
import insertBlockOnEnter from 'slate-insert-block-on-enter'

import {hasItemFocus} from '../../utils/pathUtils'
import createNodeValidator from './utils/createNodeValidator'

import ListItemOnEnterKeyPlugin from './plugins/ListItemOnEnterKeyPlugin'
import ListItemOnTabKeyPlugin from './plugins/ListItemOnTabKeyPlugin'
import OnDropPlugin from './plugins/OnDropPlugin'
import PastePlugin from './plugins/PastePlugin'
import SetMarksOnKeyComboPlugin from './plugins/SetMarksOnKeyComboPlugin'
import TextBlockOnEnterKeyPlugin from './plugins/TextBlockOnEnterKeyPlugin'
import UpdateCustomNodesPlugin from './plugins/UpdateCustomNodesPlugin'

import BlockObject from './nodes/BlockObject'
import ContentBlock from './nodes/ContentBlock'
import Decorator from './nodes/Decorator'
import InlineObject from './nodes/InlineObject'
import Span from './nodes/Span'

import styles from './styles/Editor.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  fullscreen: boolean,
  isFocused: boolean,
  markers: Marker[],
  onBlur: (nextPath: []) => void,
  onChange: (change: SlateChange) => void,
  onEditorBlur: void => void,
  onEditorFocus: void => void,
  onFocus: (nextPath: []) => void,
  onFormBuilderInputBlur: (nextPath: []) => void,
  onFormBuilderInputFocus: (nextPath: []) => void,
  onPatch: (event: PatchEvent) => void,
  readOnly?: boolean,
  type: Type,
  value: Block[]
}

export default class Editor extends React.Component<Props> {
  _blockDragMarker: ?HTMLDivElement

  _editor: ?(Node & SlateEditor) = null

  _plugins = []

  constructor(props: Props) {
    super(props)
    this._plugins = [
      ListItemOnEnterKeyPlugin({defaultBlock: EDITOR_DEFAULT_BLOCK_TYPE}),
      ListItemOnTabKeyPlugin(),
      TextBlockOnEnterKeyPlugin({defaultBlock: EDITOR_DEFAULT_BLOCK_TYPE}),
      SetMarksOnKeyComboPlugin({
        decorators: props.blockContentFeatures.decorators.map(item => item.value)
      }),
      SoftBreakPlugin({
        onlyIn: [EDITOR_DEFAULT_BLOCK_TYPE.type],
        shift: true
      }),
      PastePlugin({blockContentType: props.type}),
      insertBlockOnEnter(EDITOR_DEFAULT_BLOCK_TYPE),
      UpdateCustomNodesPlugin(),
      OnDropPlugin()
    ]
    this._validateNode = createNodeValidator(props.type, this.getValue)
  }

  // When focusPath has changed, but the editorValue has another focusBlock,
  // select the block according to the focusPath
  componentWillUpdate(nextProps: Props) {
    const {focusPath, editorValue, onChange} = nextProps
    const focusPathChanged = !isEqual(this.props.focusPath, nextProps.focusPath)
    if (focusPathChanged && !isEqual(focusPath, [{_key: editorValue.focusBlock.key}])) {
      const block = editorValue.document.getDescendant(focusPath[0]._key)
      onChange(editorValue.change().collapseToStartOf(block))
    }
  }

  // When user changes the selection in the editor, update focusPath accordingly.
  handleChange = (change: slateChange) => {
    const {onChange, onFocus, focusPath} = this.props
    const {focusBlock} = change.value
    const path = []
    if (focusBlock) {
      path.push({_key: focusBlock.key})
    }
    if (path.length && (!focusPath || focusPath.length === 1)) {
      return onChange(change, () => onFocus(path))
    }
    return onChange(change)
  }

  getValue = () => {
    return this.props.value
  }

  getEditor() {
    return this._editor
  }

  refEditor = (editor: ?SlateEditor) => {
    this._editor = editor
  }

  focus() {
    if (this._editor) {
      this._editor.focus()
    }
  }

  handleShowBlockDragMarker = (pos: string, node: HTMLDivElement) => {
    const editorDOMNode = ReactDOM.findDOMNode(this._editor)
    if (editorDOMNode instanceof HTMLElement) {
      const editorRect = editorDOMNode.getBoundingClientRect()
      const elemRect = node.getBoundingClientRect()
      const topPos = elemRect.top - editorRect.top
      const bottomPos = topPos + (elemRect.bottom - elemRect.top)
      const top = pos === 'after' ? `${parseInt(bottomPos, 10)}px` : `${parseInt(topPos, 10)}px`
      if (this._blockDragMarker) {
        this._blockDragMarker.style.display = 'block'
        this._blockDragMarker.style.top = top
      }
    }
  }

  handleHideBlockDragMarker = () => {
    if (this._blockDragMarker) {
      this._blockDragMarker.style.display = 'none'
    }
  }

  refBlockDragMarker = (blockDragMarker: ?HTMLDivElement) => {
    this._blockDragMarker = blockDragMarker
  }

  renderNode = (props: SlateComponentProps) => {
    const {
      blockContentFeatures,
      editorValue,
      focusPath,
      isFocused,
      markers,
      onChange,
      onFocus,
      onPatch,
      readOnly
    } = this.props
    const {node} = props
    let childMarkers = markers.filter(marker => marker.path[0]._key === node.data.get('_key'))
    let ObjectClass = BlockObject
    let ObjectType = blockContentFeatures.types.blockObjects.find(
      memberType => memberType.name === node.type
    )
    if (node.object === 'inline') {
      ObjectClass = InlineObject
      ObjectType = blockContentFeatures.types.inlineObjects.find(
        memberType => memberType.name === node.type
      )
      childMarkers = markers.filter(
        marker => marker.path[2] && marker.path[2]._key === node.data.get('_key')
      )
    }
    if (node.type === 'span') {
      childMarkers = markers.filter(
        marker => marker.path[2] && marker.path[2]._key === node.data.get('_key')
      )
    }

    // Set prop on blocks that are included in focusPath
    let hasFormBuilderFocus = false
    if (node.object === 'block') {
      hasFormBuilderFocus = focusPath ? hasItemFocus(focusPath, {_key: node.key}) : false
    }

    switch (node.type) {
      case 'contentBlock':
        return (
          <ContentBlock
            {...props}
            blockContentFeatures={blockContentFeatures}
            hasFormBuilderFocus={hasFormBuilderFocus}
            markers={childMarkers}
            readOnly={readOnly}
          />
        )
      case 'span':
        return (
          <Span
            attributes={props.attributes}
            blockContentFeatures={blockContentFeatures}
            editorValue={editorValue}
            markers={childMarkers}
            node={props.node}
            onChange={onChange}
            onFocus={onFocus}
            onPatch={onPatch}
            readOnly={readOnly}
            type={blockContentFeatures.types.span}
          >
            {props.children}
          </Span>
        )
      default:
        return (
          <ObjectClass
            attributes={props.attributes}
            blockContentFeatures={blockContentFeatures}
            editor={props.editor}
            editorIsFocused={isFocused}
            editorValue={editorValue}
            hasFormBuilderFocus={hasFormBuilderFocus}
            isSelected={props.isSelected}
            markers={childMarkers}
            node={props.node}
            onChange={onChange}
            onDrag={this.handleDrag}
            onFocus={onFocus}
            onHideBlockDragMarker={this.handleHideBlockDragMarker}
            onPatch={onPatch}
            onShowBlockDragMarker={this.handleShowBlockDragMarker}
            readOnly={readOnly}
            type={ObjectType}
          />
        )
    }
  }

  renderMark = (props: SlateMarkProps) => {
    const {blockContentFeatures} = this.props
    const type = props.mark.type
    const decorator = blockContentFeatures.decorators.find(item => item.value === type)
    const CustomComponent =
      decorator && decorator.blockEditor && decorator.blockEditor.render
        ? decorator.blockEditor.render
        : null
    if (CustomComponent) {
      return <CustomComponent {...props} />
    }
    return decorator ? <Decorator {...props} /> : null
  }

  render() {
    const {editorValue, fullscreen, onEditorBlur, onEditorFocus, readOnly} = this.props

    const classNames = [styles.root, fullscreen ? styles.fullscreen : null].filter(Boolean)
    return (
      <div className={classNames.join(' ')}>
        <SlateEditor
          className={styles.editor}
          ref={this.refEditor}
          value={editorValue}
          onBlur={onEditorBlur}
          onChange={this.handleChange}
          onFocus={onEditorFocus}
          validateNode={this._validateNode}
          plugins={this._plugins}
          readOnly={readOnly}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
        />
        <div
          className={styles.blockDragMarker}
          ref={this.refBlockDragMarker}
          style={{display: 'none'}}
        />
      </div>
    )
  }
}
