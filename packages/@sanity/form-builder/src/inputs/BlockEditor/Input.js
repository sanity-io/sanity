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
  Patch,
  RenderBlockActions,
  RenderCustomMarkers,
  SlateChange,
  SlateController,
  SlateValue,
  Type,
  UndoRedoStack
} from './typeDefs'

import BlockEditor from './BlockEditor'

import styles from './styles/Input.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  changeToPatches: (
    unchangedEditorValue: SlateValue,
    change: SlateChange,
    value: ?(FormBuilderValue[])
  ) => Patch[],
  controller: SlateController,
  editorValue: SlateValue,
  focusPath: [],
  level: number,
  markers: Marker[],
  onBlur: (nextPath: []) => void,
  onChange: (change: SlateChange, callback?: (SlateChange) => void) => void,
  onFocus: Path => void,
  onLoading: (props: {}) => void,
  onPatch: (event: PatchEvent) => void,
  onPaste?: ({
    event: SyntheticEvent<>,
    path: [],
    type: Type,
    value: ?(FormBuilderValue[])
  }) => {insert?: FormBuilderValue[], path?: []},
  patchesToChange: (patches: Patch[], editorValue: SlateValue, snapshot: ?any) => SlateChange,
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
    renderCustomMarkers: null
  }
  _inputId = uniqueId('BlockEditor')

  state = {
    fullscreen: false
  }

  handleToggleFullScreen = () => {
    this.setState((prevState: State) => ({fullscreen: !prevState.fullscreen}))
    this.focus()
  }

  focus = () => {
    const {controller, onFocus, onChange, value} = this.props
    controller.change(change => {
      change.focus()
      const {focusBlock} = change.value
      if (focusBlock) {
        return onChange(change, () => onFocus([{_key: focusBlock.key}]))
      } else if (Array.isArray(value) && value.length) {
        return onChange(change, () => onFocus([{_key: value[0]._key}]))
      }
      return change
    })
  }

  handleFocusSkipper = () => {
    this.focus()
  }

  render() {
    const {
      blockContentFeatures,
      changeToPatches,
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
      patchesToChange,
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
          <BlockEditor
            blockContentFeatures={blockContentFeatures}
            changeToPatches={changeToPatches}
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
            patchesToChange={patchesToChange}
            readOnly={readOnly}
            renderCustomMarkers={renderCustomMarkers}
            renderBlockActions={renderBlockActions}
            setFocus={this.focus}
            type={type}
            value={value}
            undoRedoStack={undoRedoStack}
            userIsWritingText={userIsWritingText}
          />
        </FormField>
      </div>
    )
  }
}
