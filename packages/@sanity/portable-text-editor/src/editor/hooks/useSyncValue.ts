import React, {startTransition, useMemo, useRef} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {isEqual} from 'lodash'
import {Transforms} from 'slate'
import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toSlateValue} from '../../utils/values'
import {KEY_TO_SLATE_ELEMENT} from '../../utils/weakMaps'

const debug = debugWithName('hook:useSyncValue')

export interface UseSyncValueProps {
  editor: PortableTextEditor
  isPending: React.MutableRefObject<boolean | null>
  keyGenerator: () => string
  readOnly: boolean
  slateEditor: PortableTextSlateEditor
}

export function useSyncValue(
  props: UseSyncValueProps
): (value: PortableTextBlock[] | undefined, userCallbackFn?: () => void) => void {
  const {editor, slateEditor, isPending, readOnly} = props
  const previousValue = useRef<PortableTextBlock[] | undefined>()
  return useMemo(
    () => (value: PortableTextBlock[] | undefined, userCallbackFn?: () => void) => {
      const callbackFn = () => {
        debug('Updating slate instance')
        slateEditor.onChange()
        if (userCallbackFn) {
          userCallbackFn()
        }
      }

      if (previousValue.current === value) {
        debug('Value is the same object')
        return
      }
      previousValue.current = value

      // Don't sync the value if there are pending local changes.
      // The value will be synced again after the local changes are submitted.
      if (isPending.current && !readOnly) {
        return
      }

      // If empty value, create a placeholder block
      if (!value || value.length === 0) {
        debug('Value is empty')
        callbackFn()
        return
      }
      // Test for diffs between our state value and the incoming value.)
      const isEqualToValue =
        slateEditor.children.length === (value || []).length &&
        !(value || []).some((blk, index) => {
          const compareBlock = toSlateValue(
            [blk],
            {schemaTypes: editor.schemaTypes},
            slateEditor ? KEY_TO_SLATE_ELEMENT.get(slateEditor) : undefined
          )[0]
          if (!isEqual(compareBlock, slateEditor.children[index])) {
            return true
          }
          return false
        })
      if (isEqualToValue) {
        debug('Value is equal')
        return
      }
      startTransition(() => {
        // Set the new value
        debug('Replacing changed nodes')
        if (value && value.length > 0) {
          const oldSel = slateEditor.selection
          Transforms.deselect(slateEditor)
          const slateValueFromProps = toSlateValue(
            value,
            {
              schemaTypes: editor.schemaTypes,
            },
            KEY_TO_SLATE_ELEMENT.get(slateEditor)
          )
          slateEditor.children = slateValueFromProps
          if (oldSel) {
            Transforms.select(slateEditor, oldSel)
          }
        }
        callbackFn()
      })
    },
    [editor, isPending, readOnly, slateEditor]
  )
}
