// @flow
import type {Element as ReactElement} from 'react'
import type {Block, BlockArrayType, SlateChange, SlateValue, Marker} from './typeDefs'

import {uniqueId} from 'lodash'

import React from 'react'
import blockTools from '@sanity/block-tools'

import FormField from 'part:@sanity/components/formfields/default'

import {PatchEvent} from '../../PatchEvent'
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
  readOnly?: boolean,
  type: BlockArrayType,
  undoRedoStack: {undo: [], redo: []},
  value: Block[]
}

type State = {
  fullscreen: boolean
}

export default class BlockEditorInput extends React.Component<Props, State> {
  _inputId = uniqueId('BlockEditor')

  _editor = null

  state = {
    fullscreen: false
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
    const {onFocus, onChange, editorValue} = this.props
    const change = editorValue.change().focus()
    const {focusBlock} = change.value
    onChange(change, () => onFocus([{_key: focusBlock.key}]))
  }

  handleFocusSkipper = () => {
    this.focus()
  }

  renderEditor(): ReactElement<typeof Editor> {
    const {fullscreen} = this.state
    const {
      editorValue,
      focusPath,
      markers,
      onBlur,
      onFocus,
      onChange,
      onPatch,
      readOnly,
      type,
      undoRedoStack,
      value
    } = this.props
    return (
      <Editor
        blockContentFeatures={this.blockContentFeatures}
        editorValue={editorValue}
        fullscreen={fullscreen}
        focusPath={focusPath}
        markers={markers}
        onFocus={onFocus}
        setFocus={this.focus}
        onBlur={onBlur}
        onChange={onChange}
        onPatch={onPatch}
        readOnly={readOnly}
        ref={this.refEditor}
        value={value}
        undoRedoStack={undoRedoStack}
        type={type}
      />
    )
  }

  render() {
    const {
      editorValue,
      focusPath,
      level,
      markers,
      onChange,
      onBlur,
      onFocus,
      onPatch,
      readOnly,
      type,
      value
    } = this.props

    const {fullscreen} = this.state

    const editor = this.renderEditor()

    const isActive = readOnly || (Array.isArray(focusPath) && focusPath.length >= 1)

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
          onClick={this.handleFocusSkipper}
        >
          Jump to editor
        </button>
        <BlockEditor
          blockContentFeatures={this.blockContentFeatures}
          editor={editor}
          editorValue={editorValue}
          focusPath={focusPath}
          fullscreen={fullscreen}
          isActive={isActive}
          markers={markers}
          onBlur={onBlur}
          onChange={onChange}
          onFocus={onFocus}
          onPatch={onPatch}
          onToggleFullScreen={this.handleToggleFullScreen}
          readOnly={readOnly}
          setFocus={this.focus}
          type={type}
          value={value}
        />
      </FormField>
    )
  }
}
