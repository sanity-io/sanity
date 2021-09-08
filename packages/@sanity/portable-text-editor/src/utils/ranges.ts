import {Editor, Range} from 'slate'
import {EditorSelection, EditorSelectionPoint} from '../types/editor'
import {createArrayedPath, createKeyedPath} from './paths'

export function toPortableTextRange(editor: Editor): EditorSelection {
  if (!editor.selection) {
    return editor.selection
  }
  let anchor: EditorSelectionPoint | null = null
  let focus: EditorSelectionPoint | null = null
  const anchorPath = createKeyedPath(editor.selection.anchor, editor)
  if (anchorPath) {
    anchor = {
      path: anchorPath,
      offset: editor.selection.anchor.offset,
    }
  }
  const focusPath = createKeyedPath(editor.selection.focus, editor)
  if (focusPath) {
    focus = {
      path: focusPath,
      offset: editor.selection.focus.offset,
    }
  }
  const range = anchor && focus ? {anchor, focus} : null
  return range
}

export function toSlateRange(selection: EditorSelection, editor: Editor): Range | null {
  if (!selection || !editor) {
    return null
  }
  const anchor = {
    path: createArrayedPath(selection.anchor, editor),
    offset: selection.anchor.offset,
  }
  const focus = {
    path: createArrayedPath(selection.focus, editor),
    offset: selection.focus.offset,
  }
  const range = anchor && focus ? {anchor, focus} : null
  return range
}
