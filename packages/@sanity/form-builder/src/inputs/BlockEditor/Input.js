// @flow
import type {Element as ReactElement} from 'react'
import type {Block, BlockArrayType, SlateChange, SlateValue} from './typeDefs'

import {uniqueId} from 'lodash'

import React from 'react'
import blockTools from '@sanity/block-tools'

import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import FormField from 'part:@sanity/components/formfields/default'

import PatchEvent from '../../PatchEvent'
import {getBlockObjectTypes} from './utils/resolveSchemaType'
import BlockEditor from './BlockEditor'
import Editor from './Editor'

import styles from './styles/Input.css'

type Props = {
  editorValue: SlateValue,
  focusPath: [],
  level: number,
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

  handleFakeFocus = () => {
    if (!this.state.editorIsFocused) {
      this.setState({editorIsFocused: true})
      this.focus()
      const {editorValue} = this.props
      const focusBlockKey = editorValue.focusBlock ? editorValue.focusBlock.key : null
      if (focusBlockKey) {
        this.props.onFocus([{_key: focusBlockKey}])
      }
    }
  }

  handleEditorFocus = () => {
    if (!this.state.editorIsFocused) {
      this.setState({editorIsFocused: true})
    }
    this.focus()
  }

  handleEditorBlur = () => {
    this.setState({editorIsFocused: false})
  }

  handleCanvasClick = () => {
    this.setState({editorIsFocused: true})
    this.focus()
  }

  setEditorFocus(props: Props) {
    const {editorValue, focusPath} = props || this.props
    const focusBlockKey = editorValue.focusBlock ? editorValue.focusBlock.key : null
    if (focusBlockKey && this.state.editorIsFocused) {
      this.setState({focusBlockKey})
      if (!focusPath || (focusPath && focusPath.length < 2)) {
        this.setState({focusBlockKey})
        this.props.onFocus([{_key: focusBlockKey}])
      }
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
    const {editorValue, focusPath, onFocus, onChange, onPatch, type, value} = this.props
    return (
      <Editor
        blockContentFeatures={this.blockContentFeatures}
        editorValue={editorValue}
        fullscreen={fullscreen}
        isFocused={editorIsFocused}
        focusPath={focusPath}
        onEditorBlur={this.handleEditorBlur}
        onEditorFocus={this.handleEditorFocus}
        onFocus={onFocus}
        onChange={onChange}
        onPatch={onPatch}
        ref={this.refEditor}
        value={value}
        type={type}
      />
    )
  }

  render() {
    const {editorValue, focusPath, level, onChange, onPatch, type} = this.props

    const {fullscreen, editorIsFocused} = this.state

    const editor = this.renderEditor()

    const isActive = Array.isArray(focusPath) && focusPath.length >= 1

    return (
      <FormField
        label={type.title}
        labelFor={this._inputId}
        description={type.description}
        level={level}
      >
        <button
          type="button"
          tabIndex={0}
          className={styles.focusSkipper}
          onClick={this.handleFakeFocus}
        >
          Jump to editor
        </button>
        <ActivateOnFocus isActive={isActive} message="Click to edit">
          <BlockEditor
            blockContentFeatures={this.blockContentFeatures}
            editor={editor}
            editorValue={editorValue}
            fullscreen={fullscreen}
            editorIsFocused={editorIsFocused}
            focusPath={focusPath}
            onChange={onChange}
            onPatch={onPatch}
            onToggleFullScreen={this.handleToggleFullScreen}
            type={type}
          />
        </ActivateOnFocus>
      </FormField>
    )
  }
}
