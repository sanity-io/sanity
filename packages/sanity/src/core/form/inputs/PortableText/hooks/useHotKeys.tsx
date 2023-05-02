import {useMemo, useState} from 'react'
import {HotkeyOptions, usePortableTextEditor} from '@sanity/portable-text-editor'

// This hook will create final hotkeys for the editor from on those from props.
export function useHotkeys(hotkeys: HotkeyOptions): HotkeyOptions {
  const editor = usePortableTextEditor()

  // Guard that hotkeys from props will be a stable object.
  // If this props is defined inline and is always a new object, there will be issues with key handling and cursor!
  const [initialHotkeys] = useState(() => hotkeys)
  if (initialHotkeys !== hotkeys) {
    console.warn(
      'Make sure that hotkeys are a stable object across renders, or there will be issues with key handling in the Portable Text Editor.'
    )
  }
  return useMemo(() => {
    const defaultHotkeys: {marks: Record<string, string>} = {marks: {}}
    editor.schemaTypes.decorators.forEach((dec) => {
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
  }, [editor, initialHotkeys])
}

// If we want to have a hotkey to open up a focused object, we can use this:
//
// const handleOpenObjectHotkey = (
//   event: React.BaseSyntheticEvent,
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
