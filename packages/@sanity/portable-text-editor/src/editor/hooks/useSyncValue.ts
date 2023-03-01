/* eslint-disable max-nested-callbacks */
import React, {useMemo, useRef} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {isEqual} from 'lodash'
import {Editor, Transforms} from 'slate'
import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toSlateValue} from '../../utils/values'
import {KEY_TO_SLATE_ELEMENT} from '../../utils/weakMaps'
import {withoutSaving} from '../plugins/createWithUndoRedo'
import {withPreserveKeys} from '../../utils/withPreserveKeys'
import {withoutPatching} from '../../utils/withoutPatching'

const debug = debugWithName('hook:useSyncValue')

/**
 * @internal
 */
export interface UseSyncValueProps {
  editor: PortableTextEditor
  isPending: React.MutableRefObject<boolean | null>
  keyGenerator: () => string
  readOnly: boolean
  slateEditor: PortableTextSlateEditor
}

/**
 * Syncs a value with the editor state.
 * @internal
 */
export function useSyncValue(
  props: UseSyncValueProps
): (value: PortableTextBlock[] | undefined, userCallbackFn?: () => void) => void {
  const {editor, slateEditor, isPending, readOnly} = props
  const previousValue = useRef<PortableTextBlock[] | undefined>()
  return useMemo(
    () => (value: PortableTextBlock[] | undefined, userCallbackFn?: () => void) => {
      const callbackFn = () => {
        slateEditor.onChange()
        if (userCallbackFn) {
          userCallbackFn()
        }
      }

      // Don't sync the value if there are pending local changes.
      // The value will be synced again after the local changes are submitted.
      if (isPending.current && !readOnly) {
        debug('Has local patches')
        return
      }

      if (previousValue.current === value) {
        debug('Value is the same object')
        return
      }

      previousValue.current = value

      // If empty value, create a placeholder block
      if (!value || value.length === 0) {
        debug('Value is empty')
        withoutSaving(slateEditor, () => {
          withoutPatching(slateEditor, () => {
            Editor.withoutNormalizing(slateEditor, () => {
              const len = slateEditor.children.length
              slateEditor.children.forEach((_, index) => {
                Transforms.removeNodes(slateEditor, {
                  at: [len - 1 - index],
                })
              })
              Transforms.insertNodes(slateEditor, slateEditor.createPlaceholderBlock(), {at: [0]})
            })
            Editor.normalize(slateEditor)
          })
        })
        callbackFn()
        return
      }
      // Remove, replace or add nodes according to what is changed.
      if (value && value.length > 0) {
        const slateValueFromProps = toSlateValue(
          value,
          {
            schemaTypes: editor.schemaTypes,
          },
          KEY_TO_SLATE_ELEMENT.get(slateEditor)
        )
        withoutSaving(slateEditor, () => {
          withoutPatching(slateEditor, () => {
            Editor.withoutNormalizing(slateEditor, () => {
              const childrenLength = slateEditor.children.length
              if (slateValueFromProps.length < childrenLength) {
                Array.from(Array(childrenLength - slateValueFromProps.length)).forEach(
                  (_, index) => {
                    const bIndex = childrenLength - 1 - index
                    if (bIndex > 0) {
                      Transforms.removeNodes(slateEditor, {
                        at: [bIndex],
                      })
                    }
                  }
                )
              }
              slateValueFromProps.forEach((c, i) => {
                const oldBlock = slateEditor.children[i]
                if (oldBlock && !isEqual(c, oldBlock)) {
                  debug('Replacing changed block', oldBlock)
                  const currentSel = slateEditor.selection
                  Transforms.deselect(slateEditor)
                  Transforms.removeNodes(slateEditor, {at: [i]})
                  withPreserveKeys(slateEditor, () => {
                    Transforms.insertNodes(slateEditor, c, {at: [i]})
                  })
                  if (currentSel) {
                    Transforms.select(slateEditor, currentSel)
                  }
                }
                if (!oldBlock) {
                  debug('Adding new block', c)
                  withPreserveKeys(slateEditor, () => {
                    Transforms.insertNodes(slateEditor, c, {at: [i]})
                  })
                }
              })
            })
          })
        })
      }
      callbackFn()
    },
    [editor, isPending, readOnly, slateEditor]
  )
}
