import {Editor, Transforms, Node} from 'slate'
import {Path, KeyedSegment, PathSegment} from '@sanity/types'
import type {Patch, InsertPatch, UnsetPatch} from '../types/patch'
import {PortableTextFeatures, PortableTextBlock} from '../types/portableText'
import {toSlateValue} from './values'
import {debugWithName} from './debug'
import {KEY_TO_SLATE_ELEMENT} from './weakMaps'

const debug = debugWithName('operationToPatches')

export function createPatchToOperations(portableTextFeatures: PortableTextFeatures) {
  function insertPatch(editor: Editor, patch: InsertPatch) {
    if (patch.path.length === 1) {
      const {items, position} = patch
      const blocksToInsert = (toSlateValue(
        items as PortableTextBlock[],
        portableTextFeatures.types.block.name,
        KEY_TO_SLATE_ELEMENT.get(editor)
      ) as unknown) as Node[]
      const posKey = findLastKey(patch.path)
      const index = editor.children.findIndex((node, indx) => {
        return posKey ? node._key === posKey : indx === patch.path[0]
      })
      const normalizedIdx = position === 'after' ? index + 1 : index
      debug(`Inserting blocks at path [${normalizedIdx}]`)
      Transforms.insertNodes(editor, blocksToInsert, {at: [normalizedIdx]})
      return true
    }
    return false
  }

  function unsetPatch(editor: Editor, patch: UnsetPatch) {
    // Deal with patches unsetting the whole field
    if (patch.path.length === 0) {
      debug(`Removing everything`)
      editor.children = []
      return true
    }
    if (patch.path.length === 1) {
      const lastKey = findLastKey(patch.path)
      const index = editor.children.findIndex((node, indx) =>
        lastKey ? node._key === lastKey : indx === patch.path[0]
      )
      if (index > -1) {
        Transforms.removeNodes(editor, {at: [index]})
        debug(`Removing block at path [${index}]`)
      }
      return true
    }
    return false
  }

  return function (editor: Editor, patch: Patch): boolean {
    switch (patch.type) {
      case 'insert':
        return !!insertPatch(editor, patch)
      case 'unset':
        return !!unsetPatch(editor, patch)
      default:
        debug('Unhandled patch', patch.type)
    }
    return false
  }
}

function isKeyedSegment(segment: PathSegment): segment is KeyedSegment {
  return typeof segment === 'object' && '_key' in segment
}

// Helper function to find the last part of a patch path that has a known key
function findLastKey(path: Path) {
  let key: string | null = null
  path.forEach((part) => {
    if (isKeyedSegment(part)) {
      key = part._key
    }
  })
  return key
}
