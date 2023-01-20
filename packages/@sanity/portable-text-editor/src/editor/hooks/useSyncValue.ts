import React, {useMemo} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {debounce, isEqual, throttle} from 'lodash'
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
  slateEditor: PortableTextSlateEditor
  readOnly: boolean
  isPending: React.MutableRefObject<boolean>
}

export function useSyncValue(
  props: UseSyncValueProps
): (value: PortableTextBlock[] | undefined, userCallbackFn?: () => void) => void {
  const {editor, slateEditor, isPending, readOnly} = props
  const syncFn = useMemo(
    () => (value: PortableTextBlock[] | undefined, userCallbackFn?: () => void) => {
      const val = value
      const callbackFn = () => {
        debug('Updating slate instance')
        slateEditor.onChange()
        if (userCallbackFn) {
          userCallbackFn()
        }
      }
      // Don't sync the value if we haven't submitted all the local patches yet.
      if (isPending.current && !readOnly) {
        debug('Not syncing value (has pending local patches)')
        retrySync(() => syncFn(value, userCallbackFn), callbackFn)
        return
      }
      // Test for diffs between our state value and the incoming value.)
      const isEqualToValue =
        slateEditor &&
        slateEditor.children.length === (val || []).length &&
        !(val || []).some((blk, index) => {
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
      const validation = validateValue(val, editor.schemaTypes, editor.keyGenerator)
      if (val && !validation.valid) {
        editor.change$.next({
          type: 'invalidValue',
          resolution: validation.resolution,
          value: val,
        })
        editor.setState({invalidValueResolution: validation.resolution})
      }
      // Set the new value
      debug('Replacing changed nodes')
      if (val && val.length > 0 && slateEditor) {
        const oldSel = PortableTextEditor.getSelection(editor)
        PortableTextEditor.select(editor, null)
        const slateValueFromProps = toSlateValue(
          val,
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
    [editor, slateEditor]
  )
  return syncFn
}
