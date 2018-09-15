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
  onLoading: (props: {}) => void,
  onPatch: (event: PatchEvent) => void,
  onPaste?: (
    event: SyntheticEvent,
    path: [],
    type: Type,
    value: ?Value
  ) => {insert?: Value, path?: []},
  isLoading: boolean,
  readOnly?: boolean,
  renderBlockActions?: (block: Block) => React.Node,
  renderCustomMarkers?: (Marker[]) => React.Node,
  sendPatchesFromChange: void => void,
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
    this.setState((prevState: State) => ({fullscreen: !prevState.fullscreen}))
    this.focus()
  }

  refEditor = (editor: ?Editor) => {
    this._editor = editor
  }

  focus = () => {
    const {onFocus, onChange, editorValue, value} = this.props
    const change = editorValue.change().focus()
    const {focusBlock} = change.value
    if (focusBlock) {
      return onChange(change, () => onFocus([{_key: focusBlock.key}]))
    } else if (Array.isArray(value) && value.length) {
      return onChange(change, () => onFocus([{_key: value[0]._key}]))
    }
    return change
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
      onLoading,
      onPatch,
      onPaste,
      isLoading,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      sendPatchesFromChange,
      type,
      undoRedoStack,
      value
    } = this.props
    return (
      <Editor
        blockContentFeatures={this.blockContentFeatures}
        editorValue={editorValue}
        focusPath={focusPath}
        fullscreen={fullscreen}
        isLoading={isLoading}
        markers={markers}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        onLoading={onLoading}
        onPaste={onPaste}
        onPatch={onPatch}
        onToggleFullScreen={this.handleToggleFullScreen}
        readOnly={readOnly}
        ref={this.refEditor}
        renderBlockActions={renderBlockActions}
        renderCustomMarkers={renderCustomMarkers}
        sendPatchesFromChange={sendPatchesFromChange}
        setFocus={this.focus}
        type={type}
        undoRedoStack={undoRedoStack}
        value={value}
      />
    )
  }

  render() {
    const {
      editorValue,
      focusPath,
      isLoading,
      level,
      markers,
      onChange,
      onBlur,
      onFocus,
      onLoading,
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
        markers={markers}
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
          onLoading={onLoading}
          isLoading={isLoading}
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
