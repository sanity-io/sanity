import {useMemo} from 'react'
import {
  HotkeyOptions,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'

export function useHotkeys(hotkeys: HotkeyOptions): HotkeyOptions {
  const editor = usePortableTextEditor()
  return useMemo(() => {
    const defaultHotkeys = {marks: {}}
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    ptFeatures.decorators.forEach((dec) => {
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
      marks: {...defaultHotkeys.marks, ...(hotkeys || {}).marks},
      custom: hotkeys.custom,
    }
  }, [editor, hotkeys])
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
