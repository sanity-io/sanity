import {isEqual} from 'lodash'
import {Editor, Point, Path as SlatePath, Element, Descendant} from 'slate'
import {isKeySegment, Path} from '@sanity/types'
import {EditorSelectionPoint, PortableTextMemberSchemaTypes} from '../types/editor'
import {ObjectWithKeyAndType} from './ranges'

export function createKeyedPath(
  point: Point,
  value: ObjectWithKeyAndType[] | undefined,
  types: PortableTextMemberSchemaTypes,
): Path | null {
  const blockPath = [point.path[0]]
  if (!value) {
    return null
  }
  const block = value[blockPath[0]]
  if (!block) {
    return null
  }
  const keyedBlockPath = [{_key: block._key}]
  if (block._type !== types.block.name) {
    return keyedBlockPath as Path
  }
  let keyedChildPath
  const childPath = point.path.slice(0, 2)
  const child = Array.isArray(block.children) && block.children[childPath[1]]
  if (child) {
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
      match: (n) => isKeySegment(point.path[0]) && (n as Descendant)._key === point.path[0]._key,
    }),
  )[0] || [undefined, undefined]
  if (!block || !Element.isElement(block)) {
    return []
  }
  if (editor.isVoid(block)) {
    return [blockPath[0], 0]
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
