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
          withPreserveKeys(slateEditor, () => {
            withoutPatching(slateEditor, () => {
              Editor.withoutNormalizing(slateEditor, () => {
                if (slateValueFromProps.length < slateEditor.children.length) {
                  Array.from(
                    Array(slateEditor.children.length - slateValueFromProps.length)
                  ).forEach((_, index) => {
                    Transforms.removeNodes(slateEditor, {
                      at: [slateEditor.children.length - 1 - index],
                    })
                  })
                }
                slateValueFromProps.forEach((c, i) => {
                  const oldBlock = slateEditor.children[i]
                  if (oldBlock && !isEqual(c, oldBlock)) {
                    debug('Replacing changed block', oldBlock)
                    const currentSel = slateEditor.selection
                    Transforms.deselect(slateEditor)
                    Transforms.removeNodes(slateEditor, {at: [i]})
                    Transforms.insertNodes(slateEditor, c, {at: [i]})
                    if (currentSel) {
                      Transforms.select(slateEditor, currentSel)
                    }
                  }
                  if (!oldBlock) {
                    debug('Adding new block', c)
                    Transforms.insertNodes(slateEditor, c, {at: [i]})
                  }
                })
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
