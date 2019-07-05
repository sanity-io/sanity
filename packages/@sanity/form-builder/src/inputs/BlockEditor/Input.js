// @flow

import {uniqueId} from 'lodash'

import React from 'react'

import FormField from 'part:@sanity/components/formfields/default'

import {PatchEvent} from '../../PatchEvent'

import type {
  BlockArrayType,
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  Path,
  RenderBlockActions,
  RenderCustomMarkers,
  SlateEditor,
  SlateValue,
  Type,
  UndoRedoStack
} from './typeDefs'

import BlockEditor from './BlockEditor'

import styles from './styles/Input.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  controller: SlateEditor,
  editorValue: SlateValue,
  focusPath: [],
  level: number,
  markers: Marker[],
  onBlur: (nextPath: []) => void,
  onChange: (editor: SlateEditor, callback?: (void) => void) => void,
  onFocus: Path => void,
  onLoading: (props: {}) => void,
  onPatch: (event: PatchEvent) => void,
  onPaste?: ({
    event: SyntheticEvent<>,
    path: [],
    type: Type,
    value: ?(FormBuilderValue[])
  }) => {insert?: FormBuilderValue[], path?: []},
  isLoading: boolean,
  readOnly?: boolean,
  renderBlockActions?: RenderBlockActions,
  renderCustomMarkers?: RenderCustomMarkers,
  type: BlockArrayType,
  undoRedoStack: UndoRedoStack,
  value: ?(FormBuilderValue[]),
  userIsWritingText: boolean
}

type State = {
  fullscreen: boolean
}

export default class BlockEditorInput extends React.Component<Props, State> {
  static defaultProps = {
    renderBlockActions: null,
    renderCustomMarkers: null,
    readOnly: false
  }
  inputId = uniqueId('BlockEditor')
  blockEditor = React.createRef()

  state = {
    fullscreen: false
  }

  handleToggleFullScreen = (event?: SyntheticEvent<*>) => {
    this.setState((prevState: State) => ({fullscreen: !prevState.fullscreen}))
    window.requestAnimationFrame(() => {
      this.focus()
    })
  }

  focus = () => {
    const {onFocus, readOnly} = this.props
    const blockEditor = this.blockEditor && this.blockEditor.current
    const editor = blockEditor && blockEditor.getEditor()
    if (editor && !readOnly) {
      editor.command('ensurePlaceHolderBlock')
      editor.focus()
      const key = editor.value.focusBlock
        ? editor.value.focusBlock.key
        : editor.value.document.nodes.get(0).key
      onFocus([{_key: key}])
    }
  }

  handleFocusSkipper = () => {
    this.focus()
  }

  render() {
    const {
      blockContentFeatures,
      controller,
      editorValue,
      focusPath,
      isLoading,
      level,
      markers,
      onChange,
      onBlur,
      onFocus,
      onLoading,
      onPaste,
      onPatch,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      type,
      undoRedoStack,
      userIsWritingText,
      value
    } = this.props

    const {fullscreen} = this.state

    const isActive = Array.isArray(focusPath) && focusPath.length >= 1

    return (
      <div>
        <FormField
          label={type.title}
          labelFor={this.inputId}
          markers={markers}
          description={type.description}
          level={level}
        >
          {!readOnly && (
            <button
              type="button"
              tabIndex={0}
              className={styles.focusSkipper}
              onClick={this.handleFocusSkipper}
            >
              Jump to editor
            </button>
          )}
        </FormField>
        <BlockEditor
          blockContentFeatures={blockContentFeatures}
          controller={controller}
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
          onPaste={onPaste}
          onToggleFullScreen={this.handleToggleFullScreen}
          ref={this.blockEditor}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          renderBlockActions={renderBlockActions}
          setFocus={this.focus}
          type={type}
          value={value}
          undoRedoStack={undoRedoStack}
          userIsWritingText={userIsWritingText}
        />
      </div>
    )
  }
}
