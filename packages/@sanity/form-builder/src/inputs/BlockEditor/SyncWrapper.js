// @flow

import type {Block, BlockArrayType, SlateValue, Marker} from './typeDefs'

import React from 'react'
import generateHelpUrl from '@sanity/generate-help-url'
import {uniq} from 'lodash'
import {Value} from 'slate'
import FormField from 'part:@sanity/components/formfields/default'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {PatchEvent} from '../../PatchEvent'
import Input from './Input'
import InvalidValueInput from '../InvalidValueInput'
import {resolveTypeName} from '../../utils/resolveTypeName'

import createSelectionOperation from './utils/createSelectionOperation'
import changeToPatches from './utils/changeToPatches'
import deserialize from './utils/deserialize'
import patchesToChange from './utils/patchesToChange'

import styles from './styles/SyncWrapper.css'

function findBlockType(type) {
  return type.of.find(ofType => ofType.name === 'block')
}

function isDeprecatedBlockSchema(type) {
  const blockType = findBlockType(type)
  if (blockType.span !== undefined) {
    return 'deprecatedSpan'
  }
  if (type.of.find(memberType => memberType.options && memberType.options.inline)) {
    return 'deprecatedInline'
  }
  return false
}

function isDeprecatedBlockValue(value) {
  if (!value || !Array.isArray(value)) {
    return false
  }
  const block = value.find(item => item._type === 'block')
  if (block && Object.keys(block).includes('spans')) {
    return true
  }
  return false
}

function isInvalidBlockValue(value) {
  if (Array.isArray(value)) {
    return false
  }
  if (typeof value === 'undefined') {
    return false
  }
  return true
}

type Props = {
  focusPath: [],
  markers: Marker[],
  onBlur: (nextPath: []) => void,
  onChange: PatchEvent => void,
  onFocus: (nextPath: []) => void,
  onPatch: (event: PatchEvent) => void,
  readOnly?: boolean,
  schema: Schema,
  subscribe: (() => void) => void,
  type: BlockArrayType,
  value: Block[]
}

type State = {
  deprecatedSchema: boolean,
  deprecatedBlockValue: boolean,
  invalidBlockValue: boolean,
  editorValue: SlateValue
}

export default withPatchSubscriber(
  class SyncWrapper extends React.PureComponent<Props, State> {
    _input = null
    _selection = null
    _undoRedoStack = {undo: [], redo: []}

    static defaultProps = {
      markers: []
    }

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
        editorValue:
          deprecatedSchema || deprecatedBlockValue || invalidBlockValue
            ? deserialize([], type)
            : deserialize(value, type)
      }
      this.unsubscribe = props.subscribe(this.handleDocumentPatches)
    }

    handleEditorChange = (change: SlateChange, callback: void => void) => {
      const {value, onChange, type} = this.props
      const currentEditorValue = this.state.editorValue
      this.setState({editorValue: change.value})

      const patches = changeToPatches(currentEditorValue, change, value, type)
      this._selection = createSelectionOperation(change)

      // Do the change
      onChange(PatchEvent.from(patches))

      if (callback) {
        callback(change)
        return change
      }
      return change
    }

    handleFormBuilderPatch = (event: PatchEvent) => {
      const {onChange, type} = this.props
      const {editorValue} = this.state
      const change = patchesToChange(event.patches, editorValue, null, type)
      this.setState({editorValue: change.value})
      return onChange(event)
    }

    focus() {
      this._input.focus()
    }

    // eslint-disable-next-line complexity
    handleDocumentPatches = ({patches, shouldReset, snapshot}) => {
      const {type, focusPath} = this.props
      const hasRemotePatches = patches.some(patch => patch.origin === 'remote')
      const hasInsertUnsetPatchesOnRootLevel = patches.some(
        patch => ['insert', 'unset'].includes(patch.type) && patch.path.length === 1
      )
      const hasMultipleDestinations =
        uniq(patches.map(patch => patch.path[0] && patch.path[0]._key).filter(Boolean)).length > 1
      const hasComplexity = patches.length > 3
      const shouldSetNewState =
        hasRemotePatches ||
        hasInsertUnsetPatchesOnRootLevel ||
        hasMultipleDestinations ||
        hasComplexity ||
        shouldReset
      const localPatches = patches.filter(patch => patch.origin === 'local')

      // Handle undo/redo
      if (localPatches.length) {
        const lastPatch = localPatches.slice(-1)[0]
        // Until the FormBuilder can support some kind of patch tagging,
        // we create a void patch with key 'undoRedoVoidPatch' in changesToPatches
        // to know if this is undo/redo operation or not.
        const isUndoRedoPatch =
          lastPatch && lastPatch.path[0] && lastPatch.path[0]._key === 'undoRedoVoidPatch'
        if (!isUndoRedoPatch) {
          this._undoRedoStack.undo.push({
            patches: localPatches,
            editorValue: this.state.editorValue,
            selection: this._selection
          })
          // Redo stack must be reset here
          this._undoRedoStack.redo = []
        }
      }

      // Set a new editorValue from the snapshot,
      // and restore the user's selection
      if (snapshot && shouldSetNewState) {
        const editorValue = deserialize(snapshot, type)
        const change = editorValue.change()
        if (this._selection) {
          // eslint-disable-next-line max-depth
          try {
            change.applyOperations([this._selection])
          } catch (err) {
            // eslint-disable-next-line max-depth
            if (!err.message.match('Could not find a descendant')) {
              console.error(err) // eslint-disable-line no-console
            }
          }
        }
        if ((focusPath || []).length === 1) {
          change.focus()
        }
        this.setState({editorValue: change.value})
      }
    }

    componentWillUnmount() {
      this.unsubscribe()
    }

    refInput = (input: Input) => {
      this._input = input
    }

    handleInvalidValue = () => {}

    render() {
      const {editorValue, deprecatedSchema, deprecatedBlockValue, invalidBlockValue} = this.state
      const {onChange, ...rest} = this.props
      const {type, value} = this.props
      const isDeprecated = deprecatedSchema || deprecatedBlockValue
      return (
        <div className={styles.root}>
          {!isDeprecated &&
            !invalidBlockValue && (
              <Input
                editorValue={editorValue}
                onChange={this.handleEditorChange}
                onPatch={this.handleFormBuilderPatch}
                undoRedoStack={this._undoRedoStack}
                ref={this.refInput}
                {...rest}
              />
            )}

          {invalidBlockValue && (
            <InvalidValueInput
              validTypes={type.of.map(mType => mType.name)}
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
                      Read more
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
                      Read more
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
