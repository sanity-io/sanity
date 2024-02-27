/* eslint-disable complexity */
import {type BaseRange, type Editor, type Operation, Path, Range} from 'slate'

import {
  type EditorSelection,
  type EditorSelectionPoint,
  type PortableTextMemberSchemaTypes,
} from '../types/editor'
import {createArrayedPath, createKeyedPath} from './paths'

export interface ObjectWithKeyAndType {
  _key: string
  _type: string
  children?: ObjectWithKeyAndType[]
}

export function toPortableTextRange(
  value: ObjectWithKeyAndType[] | undefined,
  range: BaseRange | Partial<BaseRange> | null,
  types: PortableTextMemberSchemaTypes,
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
  const backward = Boolean(Range.isRange(range) ? Range.isBackward(range) : undefined)
  return anchor && focus ? {anchor, focus, backward} : null
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
  if (focus.path.length === 0 || anchor.path.length === 0) {
    return null
  }
  const range = anchor && focus ? {anchor, focus} : null
  return range
}

export function moveRangeByOperation(range: Range, operation: Operation): Range | null {
  const isOverlapping =
    Range.isRange(range) && 'path' in operation && Range.includes(range, operation.path)

  // Note: important not to spread the root object here as it is a immutable object
  const rangeCopy = {anchor: {...range.anchor}, focus: {...range.focus}}

  const startPoint = Range.isBackward(range) ? rangeCopy.focus : rangeCopy.anchor
  const endPoint = Range.isBackward(range) ? rangeCopy.anchor : rangeCopy.focus
  if (isOverlapping && operation.type === 'insert_text') {
    const operationEndOffset = operation.offset + operation.text.length
    const isStartAffected = operationEndOffset <= startPoint.offset
    const isEndAffected = operationEndOffset <= endPoint.offset
    if (isStartAffected) {
      rangeCopy.anchor.offset += operation.text.length
    }
    if (isEndAffected) {
      rangeCopy.focus.offset += operation.text.length
    }
  } else if (isOverlapping && operation.type === 'remove_text') {
    const operationEndOffset = operation.offset - operation.text.length
    const isStartAffected = operationEndOffset <= startPoint.offset
    const isEndAffected = operationEndOffset <= endPoint.offset
    if (isStartAffected) {
      startPoint.offset -= operation.text.length
    }
    if (isEndAffected) {
      endPoint.offset -= operation.text.length
    }
    if (
      isStartAffected &&
      isEndAffected &&
      operation.offset - operation.text.length < startPoint.offset &&
      operation.offset > endPoint.offset
    ) {
      return null
    }
  } else if (isOverlapping && operation.type === 'split_node') {
    if (
      operation.path.length === 2 &&
      operation.path[0] === range.anchor.path[0] &&
      operation.path[0] === range.focus.path[0] &&
      operation.position <= range.anchor.offset &&
      operation.position <= range.focus.offset
    ) {
      rangeCopy.anchor.offset -= operation.position
      rangeCopy.focus.offset -= operation.position
      rangeCopy.anchor.path = Path.next(operation.path)
      rangeCopy.focus.path = range.anchor.path
    } else if (operation.path.length === 1) {
      rangeCopy.anchor.path = Path.next(operation.path)
      rangeCopy.focus.path = Path.next(operation.path)
    }
  } else if (operation.type === 'merge_node') {
    if (
      operation.path.length === 2 &&
      operation.path[0] === range.anchor.path[0] &&
      operation.path[0] === range.focus.path[0] &&
      operation.position >= range.anchor.offset &&
      operation.position >= range.focus.offset
    ) {
      rangeCopy.anchor.offset += operation.position
      rangeCopy.focus.offset += operation.position
      rangeCopy.anchor.path = Path.previous(operation.path)
      rangeCopy.focus.path = range.anchor.path
    } else if (operation.path.length === 1) {
      rangeCopy.anchor.path = Path.previous(operation.path)
      rangeCopy.focus.path = Path.previous(operation.path)
    }
  }
  return Range.equals(range, rangeCopy) ? range : rangeCopy
}
