import {
  EditorSelectionPoint,
  HotkeyOptions,
  PortableTextBlock,
  PortableTextChild,
  PortableTextEditor,
  PortableTextFeatures,
  Type,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {useCallback, useMemo} from 'react'
import {getPTEToolbarActionGroups} from './helpers'
import {PTEToolbarActionGroup} from './types'

export function useFocusBlock(): PortableTextBlock {
  const editor = usePortableTextEditor()
  const selection = useSelection()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => PortableTextEditor.focusBlock(editor), [editor, selection]) // selection must be an additional dep here
}

export function useFocusChild(): PortableTextChild {
  const editor = usePortableTextEditor()
  const selection = useSelection()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => PortableTextEditor.focusChild(editor), [editor, selection]) // selection must be an additional dep here
}

export function useFeatures(): PortableTextFeatures {
  const editor = usePortableTextEditor()

  return useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
}

export function useSelection(): {anchor: EditorSelectionPoint; focus: EditorSelectionPoint} {
  return usePortableTextEditorSelection()
}

export function useActionGroups({
  hotkeys,
  onFocus,
  resolveInitialValue,
}: {
  hotkeys: HotkeyOptions
  onFocus: (path: Path) => void
  resolveInitialValue: (type: Type) => any
}): PTEToolbarActionGroup[] {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const disabled = !selection

  const handleInsertAnnotation = useCallback(
    async (type: Type) => {
      const initialValue = await resolveInitialValue(type)

      const paths = PortableTextEditor.addAnnotation(editor, type, initialValue)
      if (paths && paths.markDefPath) {
        onFocus(paths.markDefPath.concat(FOCUS_TERMINATOR))
      }
    },
    [editor, onFocus, resolveInitialValue]
  )

  return useMemo(
    () =>
      editor ? getPTEToolbarActionGroups(editor, disabled, handleInsertAnnotation, hotkeys) : [],

    [disabled, editor, handleInsertAnnotation, hotkeys]
  )
}
