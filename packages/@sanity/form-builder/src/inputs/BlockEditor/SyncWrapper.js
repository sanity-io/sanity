// @flow

import type {
  Block,
  BlockArrayType,
  FormBuilderValue,
  SlateChange,
  SlateValue,
  SlateOperation,
  Marker,
  Path,
  Type
} from './typeDefs'

import React from 'react'
import type {Node} from 'react'
import type {List} from 'immutable'
import generateHelpUrl from '@sanity/generate-help-url'
import {debounce} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {PatchEvent} from '../../PatchEvent'
import InvalidValueInput from '../InvalidValueInput'
import {resolveTypeName} from '../../utils/resolveTypeName'
import Input from './Input'

import changeToPatches from './utils/changeToPatches'
import createSelectionOperation from './utils/createSelectionOperation'
import deserialize from './utils/deserialize'
import patchesToChange from './utils/patchesToChange'
import {localChanges$, remoteChanges$, changes$} from './utils/changeObservers'

import styles from './styles/SyncWrapper.css'

const IS_WRITING_TEXT_OPERATION_TYPES = ['insert_text', 'remove_text']
const SEND_PATCHES_TOKEN_CHARS = [' ', '\n']

function findBlockType(type: Type) {
  return type.of && type.of.find(ofType => ofType.name === 'block')
}

function isDeprecatedBlockSchema(type: Type) {
  const blockType = findBlockType(type)
  if (blockType) {
    if (blockType.span !== undefined) {
      return 'deprecatedSpan'
    }
    if (type.of && type.of.find(memberType => memberType.options && memberType.options.inline)) {
      return 'deprecatedInline'
    }
  }
  return false
}

function isDeprecatedBlockValue(value: ?(FormBuilderValue[])) {
  if (!value || !Array.isArray(value)) {
    return false
  }
  const block = value.find(item => item._type === 'block')
  if (block && Object.keys(block).includes('spans')) {
    return true
  }
  return false
}

function isInvalidBlockValue(value: ?(FormBuilderValue[])) {
  if (Array.isArray(value)) {
    return false
  }
  if (typeof value === 'undefined') {
    return false
  }
  return true
}

function isWritingTextOperationsOnly(operations: List<SlateOperation>) {
  return (
    operations.size > 0 &&
    operations.map(op => op.type).every(opType => IS_WRITING_TEXT_OPERATION_TYPES.includes(opType))
  )
}

function isTokenChar(change: SlateChange) {
  const text = change.operations.get(0) && change.operations.get(0).text
  return text && SEND_PATCHES_TOKEN_CHARS.includes(text)
}

type Props = {
  focusPath: [],
  markers: Marker[],
  onBlur: (nextPath: []) => void,
  onChange: PatchEvent => void,
  onFocus: Path => void,
  onPaste?: ({
    event: SyntheticEvent<>,
    path: [],
    type: Type,
    value: ?(FormBuilderValue[])
  }) => {insert?: FormBuilderValue[], path?: []},
  level: number,
  readOnly?: boolean,
  renderBlockActions?: (block: Block | FormBuilderValue) => Node,
  renderCustomMarkers?: (Marker[]) => Node,
  subscribe: (() => void) => void,
  type: BlockArrayType,
  value: ?(FormBuilderValue[])
}

type State = {
  decorationHash: string,
  decorations: {anchor: {key: string, offset: number}}[],
  deprecatedBlockValue: boolean,
  deprecatedSchema: boolean | string,
  editorValue: SlateValue,
  invalidBlockValue: boolean,
  isLoading: boolean,
  loading: any,
  userIsWritingText: boolean
}

export default withPatchSubscriber(
  class SyncWrapper extends React.Component<Props, State> {
    _beforeChangeEditorValue: ?SlateValue
    _unsubscribePatches: void => void
    _changeSubscription: void => void
    _input: ?Input = null
    _select = null
    _undoRedoStack = {undo: [], redo: []}

    static defaultProps = {
      markers: []
    }

    // static getDerivedStateFromProps(nextProps, state) {
    //   // Make sure changes to markers are reflected in the editor value.
    //   // Slate heavily optimizes when nodes should re-render,
    //   // so we use non-visual decorators in Slate to force the relevant editor nodes to re-render
    //   // when markers change.
    //   const newDecorationHash = nextProps.markers.map(mrkr => JSON.stringify(mrkr.path)).join('')
    //   if (
    //     nextProps.markers &&
    //     nextProps.markers.length &&
    //     newDecorationHash !== state.decorationHash
    //   ) {
    //     const {editorValue} = state
    //     const decorations = unionBy(
    //       flatten(
    //         nextProps.markers.map(mrkr => {
    //           return mrkr.path.slice(0, 3).map(part => {
    //             const key = part._key
    //             if (!key) {
    //               return null
    //             }
    //             return {
    //               anchor: {key, offset: 0},
    //               focus: {key, offset: 0},
    //               mark: {type: '__marker'} // non-visible mark (we just want the block to re-render)
    //             }
    //           })
    //         })
    //       ).filter(Boolean),
    //       state.decorations,
    //       'focus.key'
    //     )
    //     const change = editorValue.change()
    //     change.withoutSaving(() => {
    //       change.setValue({decorations})
    //     })
    //     return {
    //       decorations,
    //       decorationHash: newDecorationHash,
    //       editorValue: change.value
    //     }
    //   }
    //   return null
    // }

    constructor(props) {
      super(props)
      const {value, type} = props
      const deprecatedSchema = isDeprecatedBlockSchema(type)
      const deprecatedBlockValue = isDeprecatedBlockValue(value)
      const invalidBlockValue = isInvalidBlockValue(value)
      this.state = {
        decorationHash: '',
        decorations: [],
        deprecatedSchema,
        deprecatedBlockValue,
        editorValue:
          deprecatedSchema || deprecatedBlockValue || invalidBlockValue
            ? deserialize([], type)
            : deserialize(value, type),
        invalidBlockValue,
        isLoading: false,
        loading: {},
        userIsWritingText: false
      }
      this._unsubscribePatches = props.subscribe(this.handleDocumentPatches)
      this._changeSubscription = changes$.subscribe(this.handleChangeSet)
      this._beforeChangeEditorValue = this.state.editorValue
    }

    componentWillUnmount() {
      this._unsubscribePatches()
      this._changeSubscription.unsubscribe()
    }

    handleEditorChange = (change: SlateChange, callback?: void => void) => {
      this._beforeChangeEditorValue = this.state.editorValue
      this._select = createSelectionOperation(change)
      localChanges$.next({
        change,
        isRemote: false
      })
      const isWritingTextChange = isWritingTextOperationsOnly(change.operations) // insert or remove text
      if (isWritingTextChange) {
        this.setState({userIsWritingText: true})
        this.unsetUserIsWritingTextState()
      }
      if (callback) {
        callback(change)
        return change
      }
      return change
    }

    handleChangeSet = changeSet => {
      const {value, type, onChange} = this.props
      const {editorValue} = this.state
      const {change, isRemote} = changeSet
      // Generate patches and send them to the server if this is a local change
      if (!isRemote) {
        const patches = changeToPatches(editorValue, change, value, type)
        if (patches.length) {
          onChange(PatchEvent.from(patches))
        }
      }
      this.setState({editorValue: editorValue.change().applyOperations(change.operations).value})
    }

    unsetUserIsWritingTextState = debounce(() => {
      this.setState({userIsWritingText: false})
    }, 1000)

    handleFormBuilderPatch = (event: PatchEvent) => {
      const {onChange, type} = this.props
      const {editorValue} = this.state
      const change = patchesToChange(event.patches, editorValue, null, type)
      this.setState({editorValue: change.value})
      return onChange(event)
    }

    focus() {
      if (this._input) {
        this._input.focus()
      }
    }

    handleDocumentPatches = ({patches, shouldReset, snapshot}) => {
      const {type} = this.props
      const {editorValue} = this.state

      const remotePatches = patches.filter(
        patch =>
          patch.origin === 'remote' &&
          !(patch.path[0] && patch.path[0]._key === 'undoRedoVoidPatch')
      )
      if (remotePatches.length > 0) {
        const change = patchesToChange(remotePatches, editorValue, snapshot, type)
        remoteChanges$.next({
          change,
          isRemote: true
        })
      }

      // Handle undo/redo
      const localPatches = patches.filter(patch => patch.origin === 'local')
      if (localPatches.length) {
        const lastPatch = localPatches.slice(-1)[0]
        // Until the FormBuilder can support some kind of patch tagging,
        // we create a void patch with key 'undoRedoVoidPatch' in changesToPatches
        // to know if this is undo/redo operation or not.
        const isUndoRedoPatch =
          lastPatch && lastPatch.path[0] && lastPatch.path[0]._key === 'undoRedoVoidPatch'
        const isEditorContentPatches = localPatches.every(patch => patch.path.length < 2)
        if (!isUndoRedoPatch && isEditorContentPatches) {
          this._undoRedoStack.undo.push({
            patches: localPatches,
            // Use the _beforeChangeEditorValue here, because at this point we could be
            // in the middle of changes, and the state.editorValue may be in a flux state
            editorValue: this._beforeChangeEditorValue,
            select: this._select
          })
          // Redo stack must be reset here
          this._undoRedoStack.redo = []
        }
      }
    }

    handleOnLoading = (props = {}) => {
      const {loading} = this.state
      const _loading = {...loading, ...props}
      const isLoading = Object.keys(_loading).some(key => _loading[key])
      this.setState({isLoading, loading: _loading})
    }

    handleInvalidValue = () => {}

    refInput = (input: ?Input) => {
      this._input = input
    }

    // eslint-disable-next-line complexity
    render() {
      const {
        editorValue,
        deprecatedSchema,
        deprecatedBlockValue,
        invalidBlockValue,
        isLoading,
        userIsWritingText
      } = this.state
      const {
        focusPath,
        level,
        markers,
        onBlur,
        onFocus,
        onPaste,
        readOnly,
        renderCustomMarkers,
        renderBlockActions,
        type,
        value
      } = this.props
      const isDeprecated = deprecatedSchema || deprecatedBlockValue
      return (
        <div className={styles.root}>
          {!isDeprecated &&
            !invalidBlockValue && (
              <Input
                level={level}
                editorValue={editorValue}
                focusPath={focusPath}
                onChange={this.handleEditorChange}
                isLoading={isLoading}
                markers={markers}
                onBlur={onBlur}
                onFocus={onFocus}
                onLoading={this.handleOnLoading}
                onPaste={onPaste}
                onPatch={this.handleFormBuilderPatch}
                undoRedoStack={this._undoRedoStack}
                type={type}
                value={value}
                readOnly={readOnly}
                renderBlockActions={renderBlockActions}
                renderCustomMarkers={renderCustomMarkers}
                ref={this.refInput}
                userIsWritingText={userIsWritingText}
              />
            )}
          {invalidBlockValue && (
            <InvalidValueInput
              validTypes={type.of ? type.of.map(mType => mType.name) : []}
              actualType={resolveTypeName(value)}
              value={value}
              onChange={this.handleInvalidValue}
            />
          )}
          {isDeprecated && (
            <FormField label={type.title}>
              <div className={styles.disabledEditor}>
                <strong>Heads up!</strong>
                <p>
                  You&apos;re using a new version of the Studio with
                  {deprecatedSchema && " a block schema that hasn't been updated."}
                  {deprecatedSchema &&
                    deprecatedBlockValue &&
                    ' Also block text needs to be updated.'}
                  {deprecatedBlockValue &&
                    !deprecatedSchema &&
                    " block text that hasn't been updated."}
                </p>
                {deprecatedSchema === 'deprecatedInline' && (
                  <p>
                    <a
                      href={generateHelpUrl('migrate-to-block-inline-types')}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Migrate schema to block.children inline types
                    </a>
                  </p>
                )}
                {deprecatedSchema === 'deprecatedSpan' && (
                  <p>
                    <a
                      href={generateHelpUrl('migrate-to-block-children')}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Migrate schema to block.children
                    </a>
                  </p>
                )}
              </div>
            </FormField>
          )}
        </div>
      )
    }
  }
)
