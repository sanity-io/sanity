import {BaseRange, Editor, Range} from 'slate'
import {EditorSelection, EditorSelectionPoint, PortableTextMemberSchemaTypes} from '../types/editor'
import {createArrayedPath, createKeyedPath} from './paths'

export interface ObjectWithKeyAndType {
  _key: string
  _type: string
  children?: ObjectWithKeyAndType[]
}

export function toPortableTextRange(
  value: ObjectWithKeyAndType[] | undefined,
  range: BaseRange | Partial<BaseRange> | null,
  types: PortableTextMemberSchemaTypes
): EditorSelection {
  if (!range) {
    return null
  }
  let anchor: EditorSelectionPoint | null = null
  let focus: EditorSelectionPoint | null = null
  const anchorPath = range.anchor && createKeyedPath(range.anchor, value, types)
  if (anchorPath && range.anchor) {
    anchor = {
      path: anchorPath,
      offset: range.anchor.offset,
    }
  }
  const focusPath = range.focus && createKeyedPath(range.focus, value, types)
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
