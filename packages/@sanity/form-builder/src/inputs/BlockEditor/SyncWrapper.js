// @flow

import React from 'react'
import {getBlockContentFeatures} from '@sanity/block-tools'
import {Editor as SlateController} from 'slate'
import generateHelpUrl from '@sanity/generate-help-url'
import {debounce, unionBy, flatten, isEqual} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {PatchEvent} from '../../PatchEvent'
import InvalidValueInput from '../InvalidValueInput'
import {resolveTypeName} from '../../utils/resolveTypeName'
import type {
  BlockContentFeatures,
  BlockArrayType,
  FormBuilderValue,
  SlateChange,
  SlateValue,
  Marker,
  Patch,
  Path,
  RenderBlockActions,
  RenderCustomMarkers,
  Type,
  UndoRedoStack
} from './typeDefs'
import createEditorController from './utils/createEditorController'
import Input from './Input'
import SplitNodePlugin from './plugins/SplitNodePlugin'
import InsertNodePlugin from './plugins/InsertNodePlugin'
import MoveNodePlugin from './plugins/MoveNodePlugin'
import buildEditorSchema from './utils/buildEditorSchema'
import createChangeToPatches from './utils/createChangeToPatches'
import deserialize from './utils/deserialize'
import createPatchesToChange from './utils/createPatchesToChange'
import isWritingTextOperationsOnly from './utils/isWritingTextOperation'
import {localChanges$, remoteChanges$, changes$} from './utils/changeObservers'

import styles from './styles/SyncWrapper.css'

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

type ChangeSet = {
  callback?: SlateChange => void,
  change: SlateChange,
  editorValue: SlateValue,
  isRemote: boolean,
  patches: Patch[],
  timestamp: Date
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
  renderBlockActions?: RenderCustomMarkers,
  renderCustomMarkers?: RenderBlockActions,
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
    _unsubscribePatches: void => void
    _changeSubscription: void => void
    _input: ?Input = null
    _undoRedoStack: UndoRedoStack = {undo: [], redo: []}
    _controller: SlateController
    _blockContentFeatures: BlockContentFeatures
    _patchesToChange: (patches: Patch[], editorValue: SlateValue, snapshot: ?any) => SlateChange
    _changeToPatches: (
      unchangedEditorValue: SlateValue,
      change: SlateChange,
      value: ?(FormBuilderValue[])
    ) => Patch[]
    static defaultProps = {
      markers: []
    }

    static getDerivedStateFromProps(nextProps, state) {
      // Make sure changes to markers are reflected in the editor value.
      // Slate heavily optimizes when nodes should re-render,
      // so we use non-visual decorators in Slate to force the relevant editor nodes to re-render
      // them when markers change.
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
        return {
          decorations,
          decorationHash: newDecorationHash
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
        invalidBlockValue,
        editorValue: null,
        isLoading: false,
        loading: {},
        userIsWritingText: false
      }
      const unNormalizedEditorValue =
        deprecatedSchema || deprecatedBlockValue || invalidBlockValue
          ? deserialize([], type)
          : deserialize(value, type)

      this._unsubscribePatches = props.subscribe(this.handleDocumentPatches)
      this._changeSubscription = changes$.subscribe(this.handleChangeSet)

      this._blockContentFeatures = getBlockContentFeatures(type)
      const editorSchema = buildEditorSchema(this._blockContentFeatures)
      const controllerOpts = {
        value: unNormalizedEditorValue,
        plugins: [
          {
            schema: editorSchema
          },
          SplitNodePlugin(),
          InsertNodePlugin(),
          MoveNodePlugin()
        ]
      }
      this._controller = createEditorController(controllerOpts)
      this._patchesToChange = createPatchesToChange(this._blockContentFeatures, type)
      this._changeToPatches = createChangeToPatches(this._blockContentFeatures, type)

      this.state.editorValue = this._controller.value // Normalized value by editor schema
    }

    componentWillUnmount() {
      this._unsubscribePatches()
      this._changeSubscription.unsubscribe()
    }

    getSnapshotBeforeUpdate(prevProps: Props, prevState: State) {
      if (
        prevState.decorationHash !==
        this.props.markers.map(mrkr => JSON.stringify(mrkr.path)).join('')
      ) {
        return {updateDecorators: true}
      }
      return {updateDecorators: false}
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
      if (snapshot.updateDecorators) {
        this.updateDecorations()
      }
    }

    handleEditorChange = (change: SlateChange, callback?: void => void) => {
      const {value, onChange} = this.props
      const {editorValue} = this.state
      const patches = this._changeToPatches(editorValue, change, value)
      if (patches.length) {
        onChange(PatchEvent.from(patches))
      }
      localChanges$.next({
        change,
        editorValue,
        isRemote: false,
        timestamp: new Date(),
        callback: () => {
          if (callback) {
            return callback()
          }
          return null
        }
      })
      const userIsWritingText = isWritingTextOperationsOnly(change.operations)
      if (userIsWritingText) {
        this.setState({userIsWritingText: true})
        this.unsetUserIsWritingTextDebounced()
      }
      return change
    }

    handleChangeSet = (changeSet: ChangeSet) => {
      const {change, isRemote, callback, timestamp, patches, editorValue} = changeSet
      // Add undo step for local changes
      if (
        !isRemote &&
        !change.__isUndoRedo &&
        !change.operations.every(op => op.type === 'set_selection') &&
        !(
          change.operations.every(op => op.type === 'set_value') &&
          isEqual(Object.keys(change.operations.first().properties), ['decorations'])
        )
      ) {
        this._undoRedoStack.undo.push({
          change,
          remoteChanges: [],
          beforeChangeEditorValue: editorValue,
          timestamp,
          patches,
          snapshot: this.props.value || []
        })
        this._undoRedoStack.redo = []
      }

      // Add remote change to undo/redo steps
      if (isRemote) {
        const newItem = {patches, change: change, timestamp}
        this._undoRedoStack.undo.forEach(item => {
          item.remoteChanges.push(newItem)
        })
        this._undoRedoStack.redo.forEach(item => {
          item.remoteChanges.push(newItem)
        })
      }

      // Set the new state
      this._controller.change(controllerChange => {
        controllerChange.applyOperations(change.operations)
        // Update the editorValue state
        this.setState(
          {
            editorValue: controllerChange.value
          },
          () => {
            if (callback) {
              callback(change)
              return change
            }
            return change
          }
        )
      })
    }

    unsetUserIsWritingTextDebounced = debounce(() => {
      this.setState({userIsWritingText: false})
    }, 1000)

    updateDecorations() {
      const {decorations, editorValue} = this.state
      this._controller.change(controllerChange => {
        controllerChange.withoutSaving(() => {
          localChanges$.next({
            change: controllerChange.setValue({decorations}),
            isRemote: false,
            editorValue,
            timestamp: new Date()
          })
        })
      })
    }

    handleFormBuilderPatch = (event: PatchEvent) => {
      const {onChange} = this.props
      const {editorValue} = this.state
      const change = this._patchesToChange(event.patches, editorValue, null)
      localChanges$.next({
        change,
        editorValue,
        isRemote: false,
        timestamp: new Date()
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
      const {editorValue} = this.state

      // Handle remote (and internal) patches
      const remoteAndInternalPatches = patches.filter(patch =>
        ['remote', 'internal'].includes(patch.origin)
      )
      if (remoteAndInternalPatches.length > 0) {
        const change = this._patchesToChange(remoteAndInternalPatches, editorValue, snapshot)
        remoteChanges$.next({
          change,
          isRemote: true,
          timestamp: new Date(),
          patches: remoteAndInternalPatches
        })
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
                blockContentFeatures={this._blockContentFeatures}
                changeToPatches={this._changeToPatches}
                controller={this._controller}
                editorValue={editorValue}
                focusPath={focusPath}
                isLoading={isLoading}
                level={level}
                markers={markers}
                onBlur={onBlur}
                onChange={this.handleEditorChange}
                onFocus={onFocus}
                onLoading={this.handleOnLoading}
                onPaste={onPaste}
                onPatch={this.handleFormBuilderPatch}
                patchesToChange={this._patchesToChange}
                readOnly={readOnly}
                ref={this.refInput}
                renderBlockActions={renderBlockActions}
                renderCustomMarkers={renderCustomMarkers}
                type={type}
                undoRedoStack={this._undoRedoStack}
                userIsWritingText={userIsWritingText}
                value={value}
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
