import {BaseRange, Editor, Range} from 'slate'
import {EditorSelection, EditorSelectionPoint} from '../types/editor'
import {PortableTextBlock, PortableTextFeatures} from '../types/portableText'
import {createArrayedPath, createKeyedPath} from './paths'

export function toPortableTextRange(
  value: PortableTextBlock[] | undefined,
  range: BaseRange | Partial<BaseRange> | null,
  portableTextFeatures: PortableTextFeatures
): EditorSelection {
  if (!range) {
    return null
  }
  let anchor: EditorSelectionPoint | null = null
  let focus: EditorSelectionPoint | null = null
  const anchorPath = range.anchor && createKeyedPath(range.anchor, value, portableTextFeatures)
  if (anchorPath && range.anchor) {
    anchor = {
      path: anchorPath,
      offset: range.anchor.offset,
    }
  }
  const focusPath = range.focus && createKeyedPath(range.focus, value, portableTextFeatures)
  if (focusPath && range.focus) {
    focus = {
      path: focusPath,
      offset: range.focus.offset,
    }
  }
  return anchor && focus ? {anchor, focus} : null
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
