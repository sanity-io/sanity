import {uniqueId} from 'lodash'
import React, {RefObject} from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import {PatchEvent} from '../../PatchEvent'
import {
  BlockArrayType,
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  RenderBlockActions,
  RenderCustomMarkers,
  SlateEditor,
  SlateValue,
  Type,
  UndoRedoStack
} from './typeDefs'
import BlockEditor from './BlockEditor'
import styles from './styles/Input.css'
import {Path} from '../../typedefs/path'
type Props = {
  blockContentFeatures: BlockContentFeatures
  editorValue: SlateValue
  focusPath: []
  level: number
  markers: Marker[]
  onBlur: () => void
  onChange: (editor: SlateEditor, callback?: (arg0: void) => void) => void
  onFocus: (arg0: Path) => void
  onLoading: (props: {}) => void
  onPatch: (event: PatchEvent) => void
  onPaste?: (arg0: {
    event: React.SyntheticEvent
    path: []
    type: Type
    value: FormBuilderValue[] | null
  }) => {
    insert?: FormBuilderValue[]
    path?: []
  }
  isLoading: boolean
  readOnly?: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  type: BlockArrayType
  undoRedoStack: UndoRedoStack
  value: FormBuilderValue[] | null
  userIsWritingText: boolean
  presence: any
}
type State = {
  fullscreen: boolean
}
type BlockEditorInputState = {
  fullscreen: boolean
}
export default class BlockEditorInput extends React.Component<Props, BlockEditorInputState> {
  static defaultProps = {
    readOnly: false,
    renderBlockActions: undefined,
    renderCustomMarkers: undefined,
    onPaste: undefined
  }
  inputId = uniqueId('BlockEditor')
  blockEditor: RefObject<any> = React.createRef()
  state = {
    fullscreen: false
  }
  handleToggleFullScreen = (event?: React.SyntheticEvent<any>) => {
    this.setState((prevState: State) => ({
      fullscreen: !prevState.fullscreen
    }))
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
      value,
      presence
    } = this.props
    const {fullscreen} = this.state
    const isActive = Array.isArray(focusPath) && focusPath.length >= 1
    return (
      <div>
        <FormField
          label={type.title}
          labelFor={this.inputId}
          markers={markers}
          presence={presence}
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
