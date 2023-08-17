/* eslint-disable max-nested-callbacks */
import {useCallback, useMemo, useRef} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {debounce, isEqual} from 'lodash'
import {Editor, Transforms, Node, Descendant, Text} from 'slate'
import {useSlate} from 'slate-react'
import {PortableTextEditor} from '../PortableTextEditor'
import {EditorChange, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toSlateValue} from '../../utils/values'
import {withoutSaving} from '../plugins/createWithUndoRedo'
import {withPreserveKeys} from '../../utils/withPreserveKeys'
import {withoutPatching} from '../../utils/withoutPatching'
import {validateValue} from '../../utils/validateValue'
import {isChangingLocally, isChangingRemotely, withRemoteChanges} from '../../utils/withChanges'

const debug = debugWithName('hook:useSyncValue')

/**
 * @internal
 */
export interface UseSyncValueProps {
  keyGenerator: () => string
  onChange: (change: EditorChange) => void
  portableTextEditor: PortableTextEditor
  readOnly: boolean
}

const CURRENT_VALUE = new WeakMap<PortableTextEditor, PortableTextBlock[] | undefined>()

/**
 * Sync value with the editor state
 *
 * Normally nothing here should apply, and the editor and the real world are perfectly aligned.
 *
 * Inconsistencies could happen though, so we need to check the editor state when the value changes.
 *
 * For performance reasons, it makes sense to also do the content validation here, as we already
 * iterate over the value and can validate only the new content that is actually changed.
 *
 * @internal
 */
export function useSyncValue(
  props: UseSyncValueProps,
): (value: PortableTextBlock[] | undefined, userCallbackFn?: () => void) => void {
  const {portableTextEditor, readOnly, keyGenerator} = props
  const {change$, schemaTypes} = portableTextEditor
  const previousValue = useRef<PortableTextBlock[] | undefined>()
  const slateEditor = useSlate()
  const updateValueFunctionRef = useRef<(value: PortableTextBlock[] | undefined) => void>()

  const updateFromCurrentValue = useCallback(() => {
    const currentValue = CURRENT_VALUE.get(portableTextEditor)
    if (previousValue.current === currentValue) {
      debug('Value is the same object as previous, not need to sync')
      return
    }
    if (updateValueFunctionRef.current && currentValue) {
      debug('Updating the value debounced')
      updateValueFunctionRef.current(currentValue)
    }
  }, [portableTextEditor])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateValueDebounced = useCallback(
    debounce(updateFromCurrentValue, 1000, {trailing: true, leading: false}),
    [updateFromCurrentValue],
  )

  return useMemo(() => {
    const updateFunction = (value: PortableTextBlock[] | undefined) => {
      CURRENT_VALUE.set(portableTextEditor, value)
      const isProcessingLocalChanges = isChangingLocally(slateEditor)
      const isProcessingRemoteChanges = isChangingRemotely(slateEditor)
      if (!readOnly) {
        if (isProcessingLocalChanges) {
          debug('Has local changes, not syncing value right now')
          updateValueDebounced()
          return
        }
        if (isProcessingRemoteChanges) {
          debug('Has remote changes, not syncing value right now')
          updateValueDebounced()
          return
        }
      }

      let isChanged = false
      let isValid = true

      const hadSelection = !!slateEditor.selection

      // If empty value, remove everything in the editor and insert a placeholder block
      if (!value || value.length === 0) {
        debug('Value is empty')
        Editor.withoutNormalizing(slateEditor, () => {
          withoutSaving(slateEditor, () => {
            withoutPatching(slateEditor, () => {
              if (hadSelection) {
                Transforms.deselect(slateEditor)
              }
              const childrenLength = slateEditor.children.length
              slateEditor.children.forEach((_, index) => {
                Transforms.removeNodes(slateEditor, {
                  at: [childrenLength - 1 - index],
                })
              })
              Transforms.insertNodes(slateEditor, slateEditor.createPlaceholderBlock(), {at: [0]})
              // Add a new selection in the top of the document
              if (hadSelection) {
                Transforms.select(slateEditor, [0, 0])
              }
            })
          })
        })
        isChanged = true
      }
      // Remove, replace or add nodes according to what is changed.
      if (value && value.length > 0) {
        const slateValueFromProps = toSlateValue(value, {
          schemaTypes,
        })
        Editor.withoutNormalizing(slateEditor, () => {
          withRemoteChanges(slateEditor, () => {
            withoutSaving(slateEditor, () => {
              withoutPatching(slateEditor, () => {
                const childrenLength = slateEditor.children.length
                // Remove blocks that have become superfluous
                if (slateValueFromProps.length < childrenLength) {
                  for (let i = childrenLength - 1; i > slateValueFromProps.length - 1; i--) {
                    Transforms.removeNodes(slateEditor, {
                      at: [i],
                    })
                  }
                  isChanged = true
                }
                // Go through all of the blocks and see if they need to be updated
                slateValueFromProps.forEach((currentBlock, currentBlockIndex) => {
                  const oldBlock = slateEditor.children[currentBlockIndex]
                  const hasChanges = oldBlock && !isEqual(currentBlock, oldBlock)
                  if (hasChanges && isValid) {
                    const validationValue = [value[currentBlockIndex]]
                    const validation = validateValue(validationValue, schemaTypes, keyGenerator)
                    if (validation.valid) {
                      if (oldBlock._key === currentBlock._key) {
                        if (debug.enabled) debug('Updating block', oldBlock, currentBlock)
                        _updateBlock(slateEditor, currentBlock, oldBlock, currentBlockIndex)
                      } else {
                        if (debug.enabled) debug('Replacing block', oldBlock, currentBlock)
                        _replaceBlock(slateEditor, currentBlock, currentBlockIndex)
                      }
                      isChanged = true
                    } else {
                      change$.next({
                        type: 'invalidValue',
                        resolution: validation.resolution,
                        value,
                      })
                      isValid = false
                    }
                  }
                  if (!oldBlock && isValid) {
                    const validationValue = [value[currentBlockIndex]]
                    const validation = validateValue(validationValue, schemaTypes, keyGenerator)
                    if (debug.enabled)
                      debug(
                        'Validating and inserting new block in the end of the value',
                        currentBlock,
                      )
                    if (validation.valid) {
                      withPreserveKeys(slateEditor, () => {
                        Transforms.insertNodes(slateEditor, currentBlock, {
                          at: [currentBlockIndex],
                        })
                      })
                    } else {
                      debug('Invalid', validation)
                      change$.next({
                        type: 'invalidValue',
                        resolution: validation.resolution,
                        value,
                      })
                      isValid = false
                    }
                  }
                })
              })
            })
          })
        })
      }

      if (!isValid) {
        debug('Invalid value, returning')
        return
      }
      if (isChanged) {
        debug('Server value changed, syncing editor')
        try {
          slateEditor.onChange()
        } catch (err) {
          console.error(err)
          change$.next({
            type: 'invalidValue',
            resolution: null,
            value,
          })
          return
        }
        if (hadSelection && !slateEditor.selection) {
          Transforms.select(slateEditor, {
            anchor: {path: [0, 0], offset: 0},
            focus: {path: [0, 0], offset: 0},
          })
          slateEditor.onChange()
        }
        change$.next({type: 'value', value})
      } else {
        debug('Server value and editor value is equal, no need to sync.')
      }
      previousValue.current = value
    }
    updateValueFunctionRef.current = updateFunction
    return updateFunction
  }, [
    change$,
    keyGenerator,
    portableTextEditor,
    readOnly,
    schemaTypes,
    slateEditor,
    updateValueDebounced,
  ])
}

/**
 * This code is moved out of the above algorithm to keep complexity down.
 * @internal
 */
function _replaceBlock(
  slateEditor: PortableTextSlateEditor,
  currentBlock: Descendant,
  currentBlockIndex: number,
) {
  // While replacing the block and the current selection focus is on the replaced block,
  // temporarily deselect the editor then optimistically try to restore the selection afterwards.
  const currentSelection = slateEditor.selection
  const selectionFocusOnBlock =
    currentSelection && currentSelection.focus.path[0] === currentBlockIndex
  if (selectionFocusOnBlock) {
    Transforms.deselect(slateEditor)
  }
  Transforms.removeNodes(slateEditor, {at: [currentBlockIndex]})
  withPreserveKeys(slateEditor, () => {
    Transforms.insertNodes(slateEditor, currentBlock, {at: [currentBlockIndex]})
  })
  if (selectionFocusOnBlock) {
    Transforms.select(slateEditor, currentSelection)
  }
}

/**
 * This code is moved out of the above algorithm to keep complexity down.
 * @internal
 */
function _updateBlock(
  slateEditor: PortableTextSlateEditor,
  currentBlock: Descendant,
  oldBlock: Descendant,
  currentBlockIndex: number,
) {
  // Update the root props on the block
  Transforms.setNodes(slateEditor, currentBlock as Partial<Node>, {
    at: [currentBlockIndex],
  })
  // Text block's need to have their children updated as well (setNode does not target a node's children)
  if (slateEditor.isTextBlock(currentBlock) && slateEditor.isTextBlock(oldBlock)) {
    const oldBlockChildrenLength = oldBlock.children.length
    if (currentBlock.children.length < oldBlockChildrenLength) {
      // Remove any children that have become superfluous
      Array.from(Array(oldBlockChildrenLength - currentBlock.children.length)).forEach(
        (_, index) => {
          const childIndex = oldBlockChildrenLength - 1 - index
          if (childIndex > 0) {
            debug('Removing child')
            Transforms.removeNodes(slateEditor, {
              at: [currentBlockIndex, childIndex],
            })
          }
        },
      )
    }
    currentBlock.children.forEach((currentBlockChild, currentBlockChildIndex) => {
      const oldBlockChild = oldBlock.children[currentBlockChildIndex]
      const isChildChanged = !isEqual(currentBlockChild, oldBlockChild)
      const isTextChanged = !isEqual(currentBlockChild.text, oldBlockChild?.text)
      const path = [currentBlockIndex, currentBlockChildIndex]
      if (isChildChanged) {
        // Update if this is the same child
        if (currentBlockChild._key === oldBlockChild?._key) {
          debug('Updating changed child', currentBlockChild, oldBlockChild)
          Transforms.setNodes(slateEditor, currentBlockChild as Partial<Node>, {
            at: path,
          })
          const isSpanNode =
            Text.isText(currentBlockChild) &&
            currentBlockChild._type === 'span' &&
            Text.isText(oldBlockChild) &&
            oldBlockChild._type === 'span'
          if (isSpanNode && isTextChanged) {
            Transforms.delete(slateEditor, {
              at: {focus: {path, offset: 0}, anchor: {path, offset: oldBlockChild.text.length}},
            })
            Transforms.insertText(slateEditor, currentBlockChild.text, {
              at: path,
            })
            slateEditor.onChange()
          } else if (!isSpanNode) {
            // If it's a inline block, also update the void text node key
            debug('Updating changed inline object child', currentBlockChild)
            Transforms.setNodes(
              slateEditor,
              {_key: `${currentBlock._key}-void-child`},
              {
                at: [...path, 0],
                voids: true,
              },
            )
          }
          // Replace the child if _key's are different
        } else if (oldBlockChild) {
          debug('Replacing child', currentBlockChild)
          Transforms.removeNodes(slateEditor, {
            at: [currentBlockIndex, currentBlockChildIndex],
          })
          withPreserveKeys(slateEditor, () => {
            Transforms.insertNodes(slateEditor, currentBlockChild as Node, {
              at: [currentBlockIndex, currentBlockChildIndex],
            })
          })
          slateEditor.onChange()
          // Insert it if it didn't exist before
        } else if (!oldBlockChild) {
          debug('Inserting new child', currentBlockChild)
          withPreserveKeys(slateEditor, () => {
            Transforms.insertNodes(slateEditor, currentBlockChild as Node, {
              at: [currentBlockIndex, currentBlockChildIndex],
            })
            slateEditor.onChange()
          })
        }
      }
    })
  }
}
