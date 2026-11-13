import {useMemo, useState} from 'react'

import {type HotkeyOptions} from '../../../types/inputProps'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'

/**
 * The hotkeys the input hands to the editor's `hotkeys` prop: the default decorator hotkeys, the
 * fullscreen toggle and the deprecated `hotkeys` input prop.
 */
export type PortableTextInputHotkeys = HotkeyOptions

export const EMPTY_HOTKEYS: PortableTextInputHotkeys = {}

// This hook will create final hotkeys for the editor based on those from props.
export function useHotkeys(hotkeys: PortableTextInputHotkeys): PortableTextInputHotkeys {
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const [initialHotkeys] = useState(() => hotkeys)

  return useMemo(() => {
    const defaultHotkeys: {marks: Record<string, string>} = {marks: {}}
    schemaTypes.decorators.forEach((dec) => {
      switch (dec.value) {
        case 'strong':
          defaultHotkeys.marks['mod+b'] = dec.value
          break
        case 'em':
          defaultHotkeys.marks['mod+i'] = dec.value
          break
        case 'underline':
          defaultHotkeys.marks['mod+u'] = dec.value
          break
        case 'code':
          defaultHotkeys.marks["mod+'"] = dec.value
          break
        default:
      }
    })
    return {
      marks: {...defaultHotkeys.marks, ...(initialHotkeys || {}).marks},
      custom: initialHotkeys.custom,
    }
  }, [schemaTypes.decorators, initialHotkeys])
}

// If we want to have a hotkey to open up a focused object, we can use this:
//
// const handleOpenObjectHotkey = (
//   event: BaseSyntheticEvent,
//   ptEditor: PortableTextEditor
// ) => {
//   const selection = PortableTextEditor.getSelection(ptEditor)
//   if (selection) {
//     event.preventDefault()
//     event.stopPropagation()
//     const {focus} = selection
//     const activeAnnotations = PortableTextEditor.activeAnnotations(ptEditor)
//     const focusBlock = PortableTextEditor.focusBlock(ptEditor)
//     const focusChild = PortableTextEditor.focusChild(ptEditor)
//     if (activeAnnotations.length > 0) {
//       onFocus([
//         ...focus.path.slice(0, 1),
//         'markDefs',
//         {_key: activeAnnotations[0]._key},
//         FOCUS_TERMINATOR,
//       ])
//       return
//     }
//     if (focusChild && PortableTextEditor.isVoid(ptEditor, focusChild)) {
//       onFocus([...focus.path, FOCUS_TERMINATOR])
//       return
//     }
//     if (focusBlock && PortableTextEditor.isVoid(ptEditor, focusBlock)) {
//       onFocus([...focus.path.slice(0, 1), FOCUS_TERMINATOR])
//     }
//   }
// }
