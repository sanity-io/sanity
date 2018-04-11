// @flow
import type {Element as ReactElement} from 'react'
import type {Block, BlockArrayType, SlateChange, SlateValue, Marker} from './typeDefs'

import {uniqueId, isEqual} from 'lodash'

import React from 'react'
import blockTools from '@sanity/block-tools'

import FormField from 'part:@sanity/components/formfields/default'

import {PatchEvent} from '../../PatchEvent'
import {getBlockObjectTypes} from './utils/resolveSchemaType'
import BlockEditor from './BlockEditor'
import Editor from './Editor'

import styles from './styles/Input.css'

type Props = {
  editorValue: SlateValue,
  focusPath: [],
  level: number,
  markers: Marker[],
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
    editorIsFocused: false
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

  componentWillUpdate(nextProps: Props) {
    const {focusPath} = nextProps
    if (
      focusPath &&
      focusPath.length &&
      focusPath.length < 2 &&
      !this.state.editorIsFocused &&
      !isEqual(this.props.focusPath, focusPath)
    ) {
      this.handleEditorFocus()
    }
  }

  renderEditor(): ReactElement<typeof Editor> {
    const {fullscreen, editorIsFocused} = this.state
    const {editorValue, focusPath, markers, onBlur, onFocus, onChange, onPatch, type, value} = this.props
    return (
      <Editor
        blockContentFeatures={this.blockContentFeatures}
        editorValue={editorValue}
        fullscreen={fullscreen}
        isFocused={editorIsFocused}
        focusPath={focusPath}
        markers={markers}
        onEditorBlur={this.handleEditorBlur}
        onEditorFocus={this.handleEditorFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
        onPatch={onPatch}
        ref={this.refEditor}
        value={value}
        type={type}
      />
    )
  }

  render() {
    const {editorValue, focusPath, level, onChange, onBlur, onFocus, onPatch, type} = this.props

    const {fullscreen} = this.state

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
          onClick={this.handleEditorFocus}
        >
          Jump to editor
        </button>
        <BlockEditor
          blockContentFeatures={this.blockContentFeatures}
          editor={editor}
          editorValue={editorValue}
          focusPath={focusPath}
          fullscreen={fullscreen}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onPatch={onPatch}
          onToggleFullScreen={this.handleToggleFullScreen}
          isActive={isActive}
          type={type}
        />
      </FormField>
    )
  }
}
