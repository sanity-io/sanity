import {isEqual} from 'lodash'
import {PortableTextBlock} from '../types/portableText'
import {EditorSelection, EditorSelectionPoint} from '../types/editor'

export function normalizePoint(
  point: EditorSelectionPoint,
  value: PortableTextBlock[]
): EditorSelectionPoint | null {
  if (!point || !value) {
    return null
  }
  const newPath: any = []
  let newOffset: number = point.offset || 0
  const blockKey =
    typeof point.path[0] === 'object' && '_key' in point.path[0] && point.path[0]._key
  const childKey =
    typeof point.path[2] === 'object' && '_key' in point.path[2] && point.path[2]._key
  const block: PortableTextBlock | undefined = value.find((blk) => blk._key === blockKey)
  if (block) {
    newPath.push({_key: block._key})
  } else {
    return null
  }
  if (block && point.path[1] === 'children') {
    if (!block.children || block.children.length === 0) {
      return null
    }
    const child = block.children.find((cld: any) => cld._key === childKey)
    if (child) {
      newPath.push('children')
      newPath.push({_key: child._key})
      newOffset =
        child.text && child.text.length >= point.offset
          ? point.offset
          : (child.text && child.text.length) || 0
    } else {
      return null
    }
  }
  return {path: newPath, offset: newOffset}
}

export function normalizeSelection(
  selection: EditorSelection,
  value: PortableTextBlock[] | undefined
): EditorSelection | null {
  if (!selection || !value || value.length === 0) {
    return null
  }
  let newAnchor: EditorSelectionPoint | null = null
  let newFocus: EditorSelectionPoint | null = null
  const {anchor, focus} = selection
  if (anchor && value.find((blk) => isEqual({_key: blk._key}, anchor.path[0]))) {
    newAnchor = normalizePoint(anchor, value)
  }
  if (focus && value.find((blk) => isEqual({_key: blk._key}, focus.path[0]))) {
    newFocus = normalizePoint(focus, value)
  }
  if (newAnchor && newFocus) {
    return {anchor: newAnchor, focus: newFocus}
  }
  return null
}
