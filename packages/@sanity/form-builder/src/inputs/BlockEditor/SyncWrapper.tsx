import React from 'react'
import {Subject} from 'rxjs'
import {debounce, flatten, isEqual} from 'lodash'
import {List} from 'immutable'
import FormField from 'part:@sanity/components/formfields/default'
import {merge} from 'rxjs/operators'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {PatchEvent} from '../../PatchEvent'
import InvalidValueInput from '../InvalidValueInput'
import {resolveTypeName} from '../../utils/resolveTypeName'
import {
  BlockArrayType,
  ChangeSet,
  FormBuilderValue,
  Marker,
  Patch,
  Path,
  RenderBlockActions,
  RenderCustomMarkers,
  SlateEditor,
  SlateOperation,
  SlateSelection,
  SlateValue,
  Type,
  UndoRedoStack,
  UndoRedoStackItem
} from './typeDefs'
import createEditorController from './utils/createEditorController'
import Input from './Input'
import buildEditorSchema from './utils/buildEditorSchema'
import createOperationToPatches from './utils/createOperationToPatches'
import createPatchToOperations from './utils/createPatchToOperations'
import deserialize from './utils/deserialize'
import isWritingTextOperationsOnly from './utils/isWritingTextOperation'
import styles from './styles/SyncWrapper.css'
import {getBlockContentFeatures} from '@sanity/block-tools'
import generateHelpUrl from '@sanity/generate-help-url'
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
function isDeprecatedBlockValue(value: FormBuilderValue[] | null) {
  if (!value || !Array.isArray(value)) {
    return false
  }
  const block = value.find(item => item && item._type === 'block')
  if (block && Object.keys(block).includes('spans')) {
    return true
  }
  return false
}
function isInvalidBlockValue(value: FormBuilderValue[] | null) {
  if (Array.isArray(value)) {
    return false
  }
  if (typeof value === 'undefined') {
    return false
  }
  return true
}
type Props = {
  focusPath: []
  markers: Marker[]
  onBlur: () => void
  onChange: (arg0: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onPaste?: (arg0: {
    event: React.SyntheticEvent
    path: []
    type: Type
    value: FormBuilderValue[] | null
  }) => {
    insert?: FormBuilderValue[]
    path?: []
  }
  level: number
  readOnly?: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  subscribe: (arg0: () => void) => void
  type: BlockArrayType
  value: FormBuilderValue[] | null
  presence: any
}
type State = {
  deprecatedBlockValue: boolean
  deprecatedSchema: boolean | string
  editorValue: SlateValue
  invalidBlockValue: boolean
  isLoading: boolean
  loading: any
  userIsWritingText: boolean
}
type LocalChanges = {
  operation: SlateOperation
  patches: Patch[]
}

export default withPatchSubscriber(
  class SyncWrapper extends React.Component<Props, State> {
    static defaultProps = {
      readOnly: false,
      onPaste: undefined,
      renderBlockActions: undefined,
      renderCustomMarkers: undefined
    }
    _unsubscribePatches: (arg0: void) => void
    _changeSubscription: {
      unsubscribe: (arg0: void) => void
    }
    _input: Input | null = null
    _undoRedoStack: UndoRedoStack = {undo: [], redo: []}
    _controller: SlateEditor
    _blockContentFeatures: any
    _pendingLocalChanges: LocalChanges[][] = []
    operationToPatches: (
      operation: SlateOperation,
      beforeValue: SlateValue,
      afterValue: SlateValue,
      formBuilderValue?: FormBuilderValue[] | null
    ) => Patch[]
    patchToOperations: (patch: Patch, editorValue: SlateValue) => SlateOperation[]
    localChanges$ = new Subject()
    remoteChanges$ = new Subject()
    changes$ = this.localChanges$.pipe(merge(this.remoteChanges$))
    constructor(props) {
      super(props)
      const {value, type} = props
      const deprecatedSchema = isDeprecatedBlockSchema(type)
      const deprecatedBlockValue = isDeprecatedBlockValue(value)
      const invalidBlockValue = isInvalidBlockValue(value)
      this.state = {
        deprecatedSchema,
        deprecatedBlockValue,
        invalidBlockValue,
        editorValue: null,
        isLoading: false,
        loading: {},
        userIsWritingText: false
      }
      let displayValue = null
      try {
        displayValue =
          deprecatedSchema || deprecatedBlockValue || invalidBlockValue
            ? deserialize([], type)
            : deserialize(value, type)
      } catch (err) {
        // @ts-ignore
        this.state.invalidBlockValue = true
        displayValue = deserialize([], type)
      }
      this._blockContentFeatures = getBlockContentFeatures(type)
      const editorSchema = buildEditorSchema(this._blockContentFeatures)
      const controllerOpts = {
        value: displayValue,
        plugins: [
          {
            schema: editorSchema
          }
        ]
      }
      this._controller = createEditorController(controllerOpts)
      this.operationToPatches = createOperationToPatches(this._blockContentFeatures, type)
      this.patchToOperations = createPatchToOperations(this._blockContentFeatures, type)
      // @ts-ignore
      this.state.editorValue = this._controller.value // Normalized value by editor schema
      this._unsubscribePatches = props.subscribe(this.handleDocumentPatches)
      this._changeSubscription = this.changes$.subscribe(this.handleChangeSet)
    }
    componentWillUnmount() {
      this._unsubscribePatches()
      if (this._changeSubscription) {
        this._changeSubscription.unsubscribe()
      }
    }
    // If the document is in readOnly mode, update the editor value when the props.value is changed
    // In non-readOnly mode this is taken care of by incoming patches
    // (it's too costly to build the document all over for each change).
    componentDidUpdate(prevProps: Props) {
      const {readOnly} = this.props
      const changed = prevProps.value !== this.props.value
      if (readOnly && changed) {
        this.restoreCurrentValue(null)
      }
    }
    handleEditorChange = (editor: SlateEditor, callback?: (arg0: void) => void) => {
      const {operations, value} = editor
      const {selection} = value
      this.localChanges$.next({
        operations,
        isRemote: false,
        selection,
        callback
      })
      const userIsWritingText = isWritingTextOperationsOnly(operations)
      if (userIsWritingText) {
        this.setState({userIsWritingText: true})
        this.unsetUserIsWritingTextDebounced()
      }
    }
    restoreCurrentValue(lastKnownSelection: SlateSelection | null) {
      this._controller.setValue(deserialize(this.props.value, this.props.type))
      if (lastKnownSelection) {
        this._controller.select(lastKnownSelection)
      }
      this.setState({editorValue: this._controller.value})
    }
    handleChangeSet = (changeSet: ChangeSet) => {
      const {isRemote, selection, callback} = changeSet
      const operations: List<SlateOperation> = changeSet.operations
      // Add undo step for local changes
      if (
        !isRemote &&
        !operations.some(op => op.__isUndoRedo) &&
        !operations.every(op => op.type === 'set_selection') &&
        !operations.every(op => op.type === 'set_value') &&
        !operations.every(
          op =>
            op.type === 'set_node' &&
            op.properties &&
            op.properties.data &&
            op.properties.data.get('placeholder')
        )
      ) {
        this._undoRedoStack.undo.push({
          operations,
          beforeSelection: this.state.editorValue.selection,
          afterSelection: selection,
          remoteOperations: List([])
        })
        this._undoRedoStack.redo = []
      }
      // Add all remote operations to undo/redo stack items
      // But not rebase changes (isRemote is then 'internal')
      if (isRemote === 'remote') {
        this._undoRedoStack.undo.forEach((item: UndoRedoStackItem) => {
          item.remoteOperations = item.remoteOperations.concat(operations) as List<SlateOperation>
        })
        this._undoRedoStack.redo.forEach(item => {
          item.remoteOperations = item.remoteOperations.concat(operations) as List<SlateOperation>
        })
      }
      // Run through and apply the incoming operations
      const localChangeGroups: LocalChanges[] = []
      if (isRemote === 'internal') {
        const rebaseOperations = operations.filter(op => op.type !== 'set_selection')
        const selectOperations = operations.filter(op => op.type === 'set_selection')
        // Rebase events (replace the nodes) must not be done with normalization!
        this._controller.withoutNormalizing(() => {
          rebaseOperations.forEach(op => {
            this._controller.applyOperation(op)
          })
        })
        // Restoring of selection should be done with normalization
        selectOperations.forEach(op => {
          this._controller.applyOperation(op)
        })
      } else {
        operations.forEach(op => {
          if (isRemote) {
            this._controller.applyOperation(op)
          } else {
            const beforeValue = this._controller.value
            try {
              this._controller.applyOperation(op)
              localChangeGroups.push({
                patches: this.operationToPatches(
                  op,
                  beforeValue,
                  this._controller.value,
                  this.props.value
                ),
                operation: op
              })
            } catch (err) {
              // Let's keep this console.log for a while (2018-12-19), if we end up here, there is something fishy going on!
              // eslint-disable-next-line no-console
              console.log(
                `Got error trying to apply local operation. The error was '${
                  err.message
                }' The operation was ${JSON.stringify(op.toJSON())}`
              )
              // Restore to current formbuilder value (but try to apply the last known selection)
              this.restoreCurrentValue(beforeValue.selection)
            }
          }
        })
      }
      // Set the new state
      this.setState(
        {
          editorValue: this._controller.value
        },
        () => {
          if (localChangeGroups.length) {
            this._pendingLocalChanges.push(flatten(localChangeGroups))
            this.sendLocalPatches()
          }
          if (callback) {
            return callback()
          }
          return true
        }
      )
    }
    sendLocalPatches = () => {
      const {onChange} = this.props
      const cutLength = this._pendingLocalChanges.length
      let finalPatches = flatten(
        this._pendingLocalChanges.map(changeGroup =>
          flatten(changeGroup.map(change => change.patches))
        )
      )
      // Run through the pending patches and remove any redundant ones.
      finalPatches = finalPatches.filter((patch, index) => {
        if (!patch) {
          return false
        }
        const nextPatch = finalPatches[index + 1]
        if (
          nextPatch &&
          nextPatch.type === 'set' &&
          patch.type === 'set' &&
          isEqual(patch.path, nextPatch.path)
        ) {
          return false
        }
        return true
      })
      if (finalPatches.length) {
        // Remove the processed patches
        this._pendingLocalChanges.splice(0, cutLength)
        // Send the final patches
        onChange(PatchEvent.from(finalPatches))
      }
    }
    unsetUserIsWritingTextDebounced = debounce(() => {
      this.setState({userIsWritingText: false})
    }, 1000)
    handleFormBuilderPatch = (event: PatchEvent) => {
      const {onChange} = this.props
      event.patches.forEach(patch => {
        const operations = this.patchToOperations(patch, this._controller.value)
        this.localChanges$.next({
          operations,
          editorValue: this._controller.value,
          isRemote: true
        })
      })
      return onChange(event)
    }
    focus() {
      if (this._input) {
        this._input.focus()
      }
    }
    handleDocumentPatches = ({patches}) => {
      if (patches.length === 0) {
        return
      }
      // Handle remote (and internal) patches
      const remoteAndInternalPatches = patches.filter(patch =>
        ['remote', 'internal'].includes(patch.origin)
      )
      if (remoteAndInternalPatches.length > 0) {
        remoteAndInternalPatches.forEach(patch => {
          const operations = this.patchToOperations(patch, this._controller.value)
          this.remoteChanges$.next({
            operations,
            isRemote: patch.origin,
            patches: remoteAndInternalPatches
          })
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
    refInput = (input: Input | null) => {
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
        value,
        presence
      } = this.props
      const isDeprecated = deprecatedSchema || deprecatedBlockValue
      return (
        <div className={styles.root}>
          {!isDeprecated && !invalidBlockValue && (
            <Input
              blockContentFeatures={this._blockContentFeatures}
              editorValue={editorValue}
              focusPath={focusPath}
              isLoading={isLoading}
              level={level}
              markers={markers}
              presence={presence}
              onBlur={onBlur}
              onChange={this.handleEditorChange}
              onFocus={onFocus}
              onLoading={this.handleOnLoading}
              onPaste={onPaste}
              onPatch={this.handleFormBuilderPatch}
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
