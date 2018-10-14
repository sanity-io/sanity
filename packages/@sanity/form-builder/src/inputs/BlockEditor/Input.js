// @flow
import type {
  BlockArrayType,
  FormBuilderValue,
  BlockContentFeatures,
  Marker,
  Path,
  RenderBlockActions,
  RenderCustomMarkers,
  SlateChange,
  SlateValue,
  Type,
  UndoRedoStack
} from './typeDefs'

import {uniqueId} from 'lodash'
import {Editor as SlateController} from 'slate'

import React from 'react'

import FormField from 'part:@sanity/components/formfields/default'

import {PatchEvent} from '../../PatchEvent'
import BlockEditor from './BlockEditor'

import styles from './styles/Input.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
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

  handleTestClick = () => {
    const {onFocus} = this.props
    onFocus([{_key: '444790925455'}, 'markDefs', {_key: '282a11cadbb0'}, 'href'])
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
          {JSON.stringify(focusPath)}
          <button onClick={this.handleTestClick}>Test</button>
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
        </FormField>
      </div>
    )
  }
}
