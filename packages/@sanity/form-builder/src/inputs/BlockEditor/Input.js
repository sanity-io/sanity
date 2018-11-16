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
  _inputId = uniqueId('BlockEditor')

  state = {
    fullscreen: false
  }

  handleToggleFullScreen = (event?: SyntheticEvent<*>) => {
    this.setState((prevState: State) => ({fullscreen: !prevState.fullscreen}))
    this.focus()
  }

  focus = () => {
    const {controller, onFocus, value} = this.props
    controller.focus()
    const {focusBlock} = controller.value
    if (focusBlock) {
      onFocus([{_key: focusBlock.key}])
    } else if (Array.isArray(value) && value.length) {
      onFocus([{_key: value[0]._key}])
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
      value,
      undoRedoStack,
      userIsWritingText
    } = this.props

    const {fullscreen} = this.state

    const isActive = readOnly || (Array.isArray(focusPath) && focusPath.length >= 1)

    return (
      <div>
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
