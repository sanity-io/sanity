import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {useCallback, useMemo} from 'react'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {isEqual} from 'lodash'

const onBlur = () => {
  // We don't need to act on these.
}

export function useObjectEditFormBuilderFocus(onFocus: (path: Path) => void) {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  const onEditObjectFormBuilderFocus = useCallback(
    (nextPath: Path): void => {
      let newPath
      if (selection) {
        if (isEqual(nextPath, selection.focus.path)) {
          newPath = [...nextPath, FOCUS_TERMINATOR]
        }
        PortableTextEditor.blur(editor)
      }
      onFocus(newPath || nextPath)
    },
    [editor, onFocus, selection]
  )

  const onEditObjectFormBuilderBlur = onBlur

  const onEditObjectClose = useCallback(() => {
    PortableTextEditor.focus(editor)
  }, [editor])

  return useMemo(
    () => ({onEditObjectFormBuilderFocus, onEditObjectFormBuilderBlur, onEditObjectClose}),
    [onEditObjectFormBuilderBlur, onEditObjectFormBuilderFocus, onEditObjectClose]
  )
}
