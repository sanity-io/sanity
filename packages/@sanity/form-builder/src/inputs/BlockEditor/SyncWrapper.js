// @flow

import type {
  Block,
  BlockArrayType,
  FormBuilderValue,
  SlateChange,
  SlateValue,
  SlateOperation,
  Marker,
  Patch,
  Path,
  Type,
  UndoRedoSnapshot,
  UndoRedoStack
} from './typeDefs'

import React from 'react'
import type {Node} from 'react'
import {List} from 'immutable'
import generateHelpUrl from '@sanity/generate-help-url'
import {debounce, uniq, isEqual, unionBy, flatten, intersection} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {PatchEvent} from '../../PatchEvent'
import InvalidValueInput from '../InvalidValueInput'
import {resolveTypeName} from '../../utils/resolveTypeName'
import Input from './Input'

import changeToPatches from './utils/changeToPatches'
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

type ChangeSet = {change: SlateChange, isRemote: boolean, callback?: SlateChange => void}

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
    _undoRedoSnapShot: ?UndoRedoSnapshot
    _unsubscribePatches: void => void
    _changeSubscription: void => void
    _input: ?Input = null
    _undoRedoStack: UndoRedoStack = {undo: [], redo: []}

    static defaultProps = {
      markers: []
    }

    static getDerivedStateFromProps(nextProps, state) {
      // Make sure changes to markers are reflected in the editor value.
      // Slate heavily optimizes when nodes should re-render,
      // so we use non-visual decorators in Slate to force the relevant editor nodes to re-render
      // when markers change.
      const newDecorationHash = nextProps.markers.map(mrkr => JSON.stringify(mrkr.path)).join('')
      if (
        nextProps.markers &&
        nextProps.markers.length &&
        newDecorationHash !== state.decorationHash
      ) {
        const decorations = unionBy(
          flatten(
            nextProps.markers.map(mrkr => {
              return mrkr.path.slice(0, 3).map(part => {
                const key = part._key
                if (!key) {
                  return null
                }
                return {
                  anchor: {key, offset: 0},
                  focus: {key, offset: 0},
                  mark: {type: '__marker'} // non-visible mark (we just want the block to re-render)
                }
              })
            })
          ).filter(Boolean),
          state.decorations,
          'focus.key'
        )
        const {editorValue} = state
        const change = editorValue.change()
        change.withoutSaving(() => {
          change.setValue({decorations})
        })
        return {
          decorations,
          decorationHash: newDecorationHash,
          editorValue: change.value
        }
      }
      return null
    }

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
    }

    componentWillUnmount() {
      this._unsubscribePatches()
      this._changeSubscription.unsubscribe()
    }

    handleEditorChange = (change: SlateChange, callback?: void => void) => {
      const {value, type, onChange} = this.props
      const {editorValue} = this.state
      localChanges$.next({
        change,
        isRemote: false,
        callback
      })
      // Generate patches and send them to the server
      const patches = changeToPatches(editorValue, change, value, type)
      if (patches.length) {
        onChange(PatchEvent.from(patches))
      }
      const userIsWritingText = isWritingTextOperationsOnly(change.operations)
      if (userIsWritingText) {
        this.setState({userIsWritingText: true})
        this.unsetUserIsWritingTextDebounced()
      }
      return change
    }

    handleChangeSet = (changeSet: ChangeSet) => {
      const {editorValue} = this.state
      const {change, isRemote, callback} = changeSet
      if (!isRemote) {
        // Create a snapshot to be used in the undo/redo steps
        this._undoRedoSnapShot = {
          editorValue: editorValue,
          change: change,
          timestamp: new Date()
        }
      }
      // Update the editorValue state
      this.setState(
        {
          editorValue: editorValue.change().applyOperations(change.operations).value
        },
        () => {
          if (callback) {
            callback(change)
            return change
          }
          return change
        }
      )
    }

    unsetUserIsWritingTextDebounced = debounce(() => {
      this.setState({userIsWritingText: false})
    }, 1000)

    handleFormBuilderPatch = (event: PatchEvent) => {
      const {onChange, type} = this.props
      const {editorValue} = this.state
      const change = patchesToChange(event.patches, editorValue, null, type)
      localChanges$.next({
        change,
        isRemote: false
      })
      return onChange(event)
    }

    focus() {
      if (this._input) {
        this._input.focus()
      }
    }

    handleDocumentPatches = ({patches, shouldReset, snapshot}) => {
      if (patches.length === 0) {
        return
      }
      const {type} = this.props
      const {editorValue} = this.state

      // Handle remote patches
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
        this.normalizeUndoSteps(remotePatches)
      }

      // Handle localpatches (create undo step)
      const localPatches = patches.filter(patch => patch.origin === 'local')
      if (localPatches.length > 0) {
        // Until the FormBuilder can support some kind of patch tagging,
        // we create a void patch with key 'undoRedoVoidPatch' in changesToPatches
        // to know if these pacthes are undo/redo patches or not.
        const lastPatch = localPatches.slice(-1)[0]
        const isUndoRedoPatch =
          lastPatch && lastPatch.path[0] && lastPatch.path[0]._key === 'undoRedoVoidPatch'
        if (!isUndoRedoPatch && this._undoRedoSnapShot) {
          this.createUndoStep(
            localPatches,
            snapshot,
            this.state.editorValue,
            this._undoRedoSnapShot
          )
          // Redo stack must be reset here
          this._undoRedoStack.redo = []
        }
        this.normalizeUndoSteps()
      }
    }

    createUndoStep(
      localPatches: Patch[] = [],
      snapshot: FormBuilderValue[],
      editorValue: SlateValue,
      undoRedoSnapshot: UndoRedoSnapshot
    ) {
      const {type} = this.props
      if (this._undoRedoSnapShot) {
        const {change, timestamp} = undoRedoSnapshot
        const undoChange = editorValue.change()
        undoChange.applyOperations(change.operations)
        undoChange.applyOperations(change.operations.reverse().map(op => op.invert()))
        undoChange.operations = undoChange.operations
          .slice(change.operations.size, undoChange.operations.size)
          .filter(op => op.type !== 'set_selection')
        const inversedPatches = changeToPatches(change.value, undoChange, snapshot, type)
        this._undoRedoStack.undo.push({
          change,
          patches: localPatches,
          inversedPatches,
          editorValue,
          timestamp,
          snapshot
        })
      }
    }

    normalizeUndoSteps(remotePatches: Patch[] = []) {
      let remoteInvalidationPatchesKeys = []
      remotePatches.forEach(patch => {
        if (patch.type === 'insert') {
          remoteInvalidationPatchesKeys.push(
            patch.items.map(
              insertItem =>
                insertItem && typeof insertItem._key === 'string' ? insertItem._key : null
            )
          )
        } else if (patch.type === 'unset' && patch.path[0] && patch.path[0]._key) {
          remoteInvalidationPatchesKeys.push(patch.path[0]._key)
        }
      })
      remoteInvalidationPatchesKeys = uniq(flatten(remoteInvalidationPatchesKeys))
      const newStack = []
      // eslint-disable-next-line complexity
      this._undoRedoStack.undo.forEach((item, index) => {
        // If this item intersects with any remote patches remove it,
        // as it will no longer is valid and can cause overwriting other's edits.
        if (remoteInvalidationPatchesKeys.length > 0) {
          const itemInvalidationPatchesPaths = uniq(
            flatten(
              item.patches.map(patch => {
                if (patch.type === 'insert') {
                  return patch.items.map(
                    insertItem =>
                      insertItem && typeof insertItem._key === 'string' ? insertItem._key : null
                  )
                }
                return patch.path[0] && patch.path[0]._key ? patch.path[0]._key : []
              })
            )
          )
          if (
            intersection(remoteInvalidationPatchesKeys, itemInvalidationPatchesPaths).length > 0
          ) {
            this._undoRedoStack.redo = []
            return
          }
        }
        const nextItem = this._undoRedoStack.undo[index + 1]
        // Always include first and last item
        if (index === 0 || !nextItem) {
          newStack.push(item)
          return
        }
        // If the change was a token char (space or enter), include the item
        if (isTokenChar(item.change)) {
          newStack.push(item)
          return
        }
        // If there was over a second since the last change, include the item
        const isTimedOut = nextItem.timestamp - item.timestamp > 1000
        if (isTimedOut) {
          newStack.push(item)
          return
        }
        // If the next change is just writing or removing text on the same block, skip it!
        const nextPaths = uniq(nextItem.patches.map(patch => patch.path))
        const thisPaths = uniq(item.patches.map(patch => patch.path))
        const nextWriteTextOnly = isWritingTextOperationsOnly(nextItem.change.operations)
        const itemWriteTextOnly = isWritingTextOperationsOnly(item.change.operations)
        const itemIsRedundant =
          isEqual(nextPaths, thisPaths) && nextWriteTextOnly && itemWriteTextOnly
        if (!itemIsRedundant) {
          newStack.push(item)
        }
      })
      this._undoRedoStack.undo = newStack
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
