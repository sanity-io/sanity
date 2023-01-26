import React, {useMemo, useRef} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {isEqual, throttle} from 'lodash'
import {PortableTextEditor} from '../PortableTextEditor'
import {PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toSlateValue} from '../../utils/values'
import {KEY_TO_SLATE_ELEMENT} from '../../utils/weakMaps'
import {validateValue} from '../../utils/validateValue'

const debug = debugWithName('hook:useSyncValue')
const retrySync = throttle((syncFn, callbackFn) => syncFn(callbackFn), 100)

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
  const {editor, slateEditor, isPending, readOnly, keyGenerator} = props
  const previousValue = useRef<PortableTextBlock[] | undefined>()
  const syncFn = useMemo(
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
        // debug('Not syncing value (has pending local patches)')
        // retrySync(() => syncFn(value, userCallbackFn), callbackFn)
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
      // Value is different - validate it.
      debug('Validating')
      const validation = validateValue(value, editor.schemaTypes, keyGenerator)
      if (value && !validation.valid) {
        editor.change$.next({
          type: 'invalidValue',
          resolution: validation.resolution,
          value: value,
        })
        editor.setState({invalidValueResolution: validation.resolution})
      }
      // Set the new value
      debug('Replacing changed nodes')
      if (value && value.length > 0) {
        const oldSel = PortableTextEditor.getSelection(editor)
        PortableTextEditor.select(editor, null)
        const slateValueFromProps = toSlateValue(
          value,
          {
            schemaTypes: editor.schemaTypes,
          },
          KEY_TO_SLATE_ELEMENT.get(slateEditor)
        )
        slateEditor.children = slateValueFromProps
        if (oldSel) {
          PortableTextEditor.select(editor, oldSel)
        }
      }
      callbackFn()
    },
    [editor, isPending, keyGenerator, readOnly, slateEditor]
  )
  return syncFn
}
