// @flow
import type {Element as ReactElement} from 'react'
import type {Block, BlockArrayType, SlateChange, SlateValue} from './typeDefs'

import {uniqueId} from 'lodash'

import React from 'react'
import blockTools from '@sanity/block-tools'

import FormField from 'part:@sanity/components/formfields/default'

import PatchEvent from '../../PatchEvent'
import {getBlockObjectTypes} from './utils/resolveSchemaType'
import Editor from './Editor'
import BlockEditor from './BlockEditor'

type Props = {
  editorValue: SlateValue,
  focusKey: ?string,
  level: number,
  onBlur: (nextPath: []) => void,
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  onPatch: (event: PatchEvent) => void,
  type: BlockArrayType,
  value: Block[]
}

type State = {
  fullscreen: boolean,
  editorIsFocused: boolean,
  focusBlockKey: string
}

export default class BlockEditorInput extends React.Component<Props, State> {
  _inputId = uniqueId('BlockEditor')

  _editor = null

  state = {
    fullscreen: false,
    editorIsFocused: false,
    focusBlockKey: null
  }

  blockContentFeatures = {
    decorators: [],
    styles: [],
    annotations: [],
    blockObjectTypes: []
  }

  constructor(props: Props) {
    super(props)
    this.blockContentFeatures = blockTools.getBlockContentFeatures(props.type)
    this.blockContentFeatures.blockObjectTypes = getBlockObjectTypes(props.type)
  }

  handleToggleFullScreen = () => {
    const {fullscreen} = this.state
    this.setState({fullscreen: !fullscreen})
    this.focus()
  }

  refEditor = (editor: ?Editor) => {
    this._editor = editor
  }

  focus = () => {
    if (this._editor) {
      this._editor.focus()
    }
  }

  handleEditorFocus = () => {
    this.setState({editorIsFocused: true})
    this.focus()
  }

  handleEditorBlur = () => {
    this.setState({editorIsFocused: false})
  }

  handleFormBuilderInputFocus = (nextPath: []) => {
    this.props.onFocus(nextPath)
  }

  handleFormBuilderInputBlur = (nextPath: []) => {
    this.props.onBlur(nextPath)
  }

  handleCanvasClick = () => {
    this.setState({editorIsFocused: true})
  }

  setEditorFocus(props: Props) {
    const {editorValue} = props || this.props
    const focusBlockKey = editorValue.focusBlock ? editorValue.focusBlock.key : null
    if (focusBlockKey && this.state.editorIsFocused) {
      this.setState({focusBlockKey})
      this.props.onFocus([{_key: focusBlockKey}])
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const {editorValue} = nextProps
    if (!editorValue) {
      return
    }
    const focusKey = editorValue.selection.focusKey
    const currentFocusBlockKey = this.state.focusBlockKey
    if (focusKey !== currentFocusBlockKey) {
      this.setEditorFocus(nextProps)
    }
  }

  renderEditor(): ReactElement<typeof Editor> {
    const {fullscreen, editorIsFocused} = this.state
    const {editorValue, onChange, onPatch, type, value} = this.props
    return (
      <Editor
        blockContentFeatures={this.blockContentFeatures}
        editorValue={editorValue}
        fullscreen={fullscreen}
        isFocused={editorIsFocused}
        onBlur={this.handleEditorBlur}
        onFocus={this.handleEditorFocus}
        onFormBuilderInputBlur={this.handleFormBuilderInputBlur}
        onFormBuilderInputFocus={this.handleFormBuilderInputFocus}
        onChange={onChange}
        onPatch={onPatch}
        ref={this.refEditor}
        value={value}
        type={type}
      />
    )
  }

  render() {
    const {editorValue, level, onChange, onPatch, type} = this.props

    const {fullscreen, editorIsFocused} = this.state

    const editor = this.renderEditor()

    return (
      <FormField
        label={type.title}
        labelFor={this._inputId}
        description={type.description}
        level={level}
      >
        {/* Make label click work */}
        {false && (
          <div style={{position: 'absolute', width: '0px', overflow: 'hidden'}}>
            <input tabIndex={0} type="text" id={this._inputId} onFocus={this.handleFakeFocus} />
          </div>
        )}
        {JSON.stringify(this.state.focus)}
        <BlockEditor
          blockContentFeatures={this.blockContentFeatures}
          editor={editor}
          editorValue={editorValue}
          fullscreen={fullscreen}
          editorIsFocused={editorIsFocused}
          onChange={onChange}
          onPatch={onPatch}
          onToggleFullScreen={this.handleToggleFullScreen}
          type={type}
        />
      </FormField>
    )
  }
}
