import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {useCallback, useMemo} from 'react'

const onBlur = () => {
  // We don't need to act on these.
}

export function useObjectEditFormBuilderFocus(onFocus: (path: Path) => void) {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  const onEditObjectFormBuilderFocus = useCallback(
    (nextPath: Path): void => {
      if (nextPath && selection) {
        PortableTextEditor.blur(editor)
      }
      onFocus(nextPath)
    },
    [editor, onFocus, selection]
  )

  const onEditObjectFormBuilderBlur = onBlur

  const onEditObjectClose = useCallback(() => {
    if (selection) {
      PortableTextEditor.select(editor, selection)
    }
    onFocus(selection?.focus.path || [])
  }, [editor, onFocus, selection])

  return useMemo(
    () => ({onEditObjectFormBuilderFocus, onEditObjectFormBuilderBlur, onEditObjectClose}),
    [onEditObjectFormBuilderBlur, onEditObjectFormBuilderFocus, onEditObjectClose]
  )
}
