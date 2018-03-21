// @flow
import type {
  Block,
  BlockContentFeatures,
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
import {EDITOR_DEFAULT_BLOCK_TYPE} from '@sanity/block-tools'
import resolveSchemaType from './utils/resolveSchemaType'
import createNodeValidator from './utils/createNodeValidator'

import ListItemOnEnterKeyPlugin from './plugins/ListItemOnEnterKeyPlugin'
import ListItemOnTabKeyPlugin from './plugins/ListItemOnTabKeyPlugin'
import PastePlugin from './plugins/PastePlugin'
import SetMarksOnKeyComboPlugin from './plugins/SetMarksOnKeyComboPlugin'
import TextBlockOnEnterKeyPlugin from './plugins/TextBlockOnEnterKeyPlugin'

import BlockObject from './nodes/BlockObject'
import ContentBlock from './nodes/ContentBlock'
import Decorator from './nodes/Decorator'
import EditNode from './EditNode'
import Span from './nodes/Span'

import styles from './styles/Editor.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  fullscreen: boolean,
  focusPath: [],
  isFocused: boolean,
  onChange: (change: SlateChange) => void,
  onEditorBlur: void => void,
  onEditorFocus: void => void,
  onFocus: (nextPath: []) => void,
  onFormBuilderInputBlur: (nextPath: []) => void,
  onFormBuilderInputFocus: (nextPath: []) => void,
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
      PastePlugin({blockContentType: props.type})
    ]
    this._validateNode = createNodeValidator(props.type, this.getValue)
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

  renderEditNode() {
    const {focusPath, editorValue, type, onPatch, onFocus} = this.props
    const editNodeKey = focusPath[0]._key

    const node = editorValue.document.getDescendant(editNodeKey)
    if (!node) {
      // eslint-disable-next-line no-console
      console.error(new Error(`Could not find node with key ${editNodeKey}`))
      return null
    }
    const nodeValue = node.data.get('value')

    return (
      <EditNode
        value={nodeValue}
        type={type}
        onChange={onPatch}
        focusPath={focusPath}
        onFocus={onFocus}
      />
    )
  }

  renderNode = (props: SlateComponentProps) => {
    const {
      blockContentFeatures,
      editorValue,
      isFocused,
      onChange,
      onFocus,
      onPatch,
      type
    } = this.props
    const nodeType = props.node.type
    switch (nodeType) {
      case 'contentBlock':
        return <ContentBlock {...props} blockContentFeatures={blockContentFeatures} />
      case 'span':
        return (
          <Span
            attributes={props.attributes}
            blockContentFeatures={blockContentFeatures}
            editorValue={editorValue}
            node={props.node}
            onChange={onChange}
            onFocus={onFocus}
            onPatch={onPatch}
            type={resolveSchemaType(type, nodeType)}
          >
            {props.children}
          </Span>
        )
      default:
        return (
          <BlockObject
            attributes={props.attributes}
            blockContentFeatures={blockContentFeatures}
            editorValue={editorValue}
            editorIsFocused={isFocused}
            node={props.node}
            editor={props.editor}
            onChange={onChange}
            onFocus={onFocus}
            onPatch={onPatch}
            onDrag={this.handleDrag}
            isSelected={props.isSelected}
            onShowBlockDragMarker={this.handleShowBlockDragMarker}
            onHideBlockDragMarker={this.handleHideBlockDragMarker}
            type={resolveSchemaType(type, nodeType)}
          >
            {props.children}
          </BlockObject>
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
    const {
      focusPath,
      onChange,
      onEditorBlur,
      onEditorFocus,
      editorValue,
      isFocused,
      fullscreen
    } = this.props

    const isExpanded = (focusPath || []).length > 1

    const classNames = [
      styles.root,
      fullscreen ? styles.fullscreen : null,
      isFocused ? styles.focus : null
    ].filter(Boolean)

    return (
      <div className={classNames.join(' ')}>
        <SlateEditor
          className={styles.editor}
          ref={this.refEditor}
          value={editorValue}
          onBlur={onEditorBlur}
          onChange={onChange}
          onFocus={onEditorFocus}
          validateNode={this._validateNode}
          plugins={this._plugins}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          onShowDragMarker={this.handleShowBlockDragMarker}
        />
        <div
          className={styles.blockDragMarker}
          ref={this.refBlockDragMarker}
          style={{display: 'none'}}
        />
        {isExpanded && this.renderEditNode()}
      </div>
    )
  }
}
