import {isEqual} from 'lodash'
import {Editor, Point, Path as SlatePath, Element, Node} from 'slate'
import {isKeySegment, Path} from '@sanity/types'
import {EditorSelectionPoint} from '../types/editor'

export function createKeyedPath(point: Point, editor: Editor): Path | null {
  const blockPath = [point.path[0]]
  let block: Node
  try {
    ;[block] = Editor.node(editor, blockPath, {depth: 1})
  } catch (err) {
    return null
  }
  if (!block || !Element.isElement(block)) {
    return null
  }
  const keyedBlockPath = [{_key: block._key}]
  if (editor.isVoid(block)) {
    return keyedBlockPath as Path
  }
  let keyedChildPath
  let child: Node
  const childPath = point.path.slice(0, 2)
  if (childPath.length === 2) {
    try {
      ;[child] = Editor.node(editor, childPath, {depth: 2})
    } catch (err) {
      return null
    }
    keyedChildPath = ['children', {_key: child._key}]
  }
  return (keyedChildPath ? [...keyedBlockPath, ...keyedChildPath] : keyedBlockPath) as Path
}

export function createArrayedPath(point: EditorSelectionPoint, editor: Editor): SlatePath {
  if (!editor) {
    return []
  }
  const [block, blockPath] = Array.from(
    Editor.nodes(editor, {
      at: [],
      match: (n) => isKeySegment(point.path[0]) && n._key === point.path[0]._key,
    })
  )[0] || [undefined, undefined]
  if (!block || !Element.isElement(block)) {
    return []
  }
  if (editor.isVoid(block)) {
    return blockPath
  }
  const childPath = [point.path[2]]
  const childIndex = block.children.findIndex((child) => isEqual([{_key: child._key}], childPath))
  if (childIndex >= 0 && block.children[childIndex]) {
    const child = block.children[childIndex]
    if (Element.isElement(child) && editor.isVoid(child)) {
      return blockPath.concat(childIndex).concat(0)
    }
    return blockPath.concat(childIndex)
  }
  return blockPath
}
