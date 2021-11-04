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
import {useUnique} from './lib/useUnique'
import {BlockStyleItem, PTEToolbarAction, PTEToolbarActionGroup} from './types'

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
  disabled,
}: {
  hotkeys: HotkeyOptions
  onFocus: (path: Path) => void
  resolveInitialValue: (type: Type) => any
  disabled: boolean
}): PTEToolbarActionGroup[] {
  const editor = usePortableTextEditor()

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

    [
      disabled,
      editor,
      handleInsertAnnotation,
      hotkeys,

      // Selection must be part of the dep. here!
      // selection,
    ]
  )
}

export function useActiveActionKeys({
  actions,
}: {
  actions: Array<PTEToolbarAction & {firstInGroup?: true}>
}): string[] {
  const editor = usePortableTextEditor()
  const selection = useSelection()

  return useUnique(
    useMemo(
      () => {
        const activeAnnotationKeys = PortableTextEditor.activeAnnotations(editor).map(
          (a) => a._type
        )

        return actions
          .filter((a) => {
            if (a.type === 'annotation') {
              return activeAnnotationKeys.includes(a.key)
            }

            if (a.type === 'listStyle') {
              return PortableTextEditor.hasListStyle(editor, a.key)
            }

            return PortableTextEditor.isMarkActive(editor, a.key)
          })
          .map((a) => a.key)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        editor,
        // This is needed so that active actions update as `selection` changes
        selection,
      ]
    )
  )
}

export function useActiveStyleKeys({items}: {items: BlockStyleItem[]}): string[] {
  const editor = usePortableTextEditor()
  const focusBlock = useFocusBlock()
  const selection = useSelection()

  return useUnique(
    useMemo(
      () =>
        items.filter((i) => PortableTextEditor.hasBlockStyle(editor, i.style)).map((i) => i.style),
      //  eslint-disable-next-line react-hooks/exhaustive-deps
      [focusBlock, selection]
    )
  )
}
