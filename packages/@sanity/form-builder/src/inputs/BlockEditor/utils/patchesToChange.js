// @flow
import {blocksToEditorValue} from '@sanity/block-tools'
import {Value, Document} from 'slate'
import type {Type, Path} from '../typeDefs'
import type {
  Patch,
  SetPatch,
  InsertPatch,
  UnsetPatch,
  SetIfMissingPatch
} from '../../../typedefs/patch'

import {applyAll} from '../../../simplePatch'
import findInlineByAnnotationKey from './findInlineByAnnotationKey'

type JSONValue = number | string | boolean | {[string]: JSONValue} | JSONValue[]
// const VALUE_TO_JSON_OPTS = {
//   preserveData: true,
//   preserveKeys: true,
//   preserveSelection: false,
//   preserveHistory: false
// }

function findLastKey(path: Path[]) {
  let key = null
  path.forEach(part => {
    if (part._key) {
      key = part._key
    }
  })
  return key
}

function setPatch(patch: SetPatch, change: () => void, type: Type) {
  if (Array.isArray(patch.value)) {
    if (patch.path.length === 0) {
      return replaceValue(patch.value, change, type)
    }
    throw new Error(`Invalid patch, looks like it should be an insert: ${JSON.stringify(patch)}`)
  }
  const editorBlock = blocksToEditorValue([patch.value], type).document.nodes[0]
  const key = findLastKey(patch.path)
  change.replaceNodeByKey(key, editorBlock)
  return change
}

function setIfMissingPatch(patch: SetIfMissingPatch, change: () => void, type: Type) {
  if (patch.path.length === 0) {
    return replaceValue(patch.value, change, type)
  }
  const doc = change.value.document
  const blockKey = patch.path[0]._key
  const block = doc.nodes.find(node => node.key === blockKey)
  if (change.value.schema.isVoid(block)) {
    const data = block.data.toObject()
    if (!data.value) {
      const newData = {...data, value: patch.value}
      change.setNodeByKey(blockKey, {data: newData})
    }
  } else {
    throw new Error(`Invalid patch, looks like it should be an insert: ${JSON.stringify(patch)}`)
  }
  return change
}

function insertPatch(patch: InsertPatch, change: () => void, type: Type) {
  const {items, position} = patch
  const fragment = Document.fromJSON(blocksToEditorValue(items, type).document)
  const posKey = findLastKey(patch.path)
  let index = change.value.document.nodes.findIndex(node => {
    return node.key === posKey
  })
  if (position === 'before') {
    index = index > 0 ? index-- : index
  }
  if (position === 'after') {
    index++
  }
  return change.insertFragmentByPath([], index, fragment)
}

function unsetPatch(patch: UnsetPatch, change: () => void) {
  const lastKey = findLastKey(patch.path)
  change.removeNodeByKey(lastKey)
  return change
}

function replaceValue(snapshot: ?JSONValue, change: () => void, type: Type) {
  if (snapshot) {
    const fragment = blocksToEditorValue(snapshot, type)
    // Don't save these changes (we don't want reversed undo/redo steps for them)
    change.withoutSaving(() => {
      if (change.value.document.nodes.size) {
        change.moveToRangeOfDocument().delete()
      }
      change.applyOperations(
        fragment.document.nodes.reverse().map(node => {
          return {
            type: 'insert_node',
            path: [0],
            node: node
          }
        })
      )
    })
    return change
  }
  throw new Error('No snapshot given!')
}

// eslint-disable-next-line complexity
function patchAnnotationData(patch: Patch, change: () => void, type: Type, snapshot: ?JSONValue) {
  const doc = change.value.document
  const blockKey = patch.path[0]._key
  const markDefKey = patch.path[2]._key
  const node = findInlineByAnnotationKey(markDefKey, doc)

  const data = node.data.toObject()
  data.annotations = data.annotations || {}
  const annotationKey = Object.keys(data.annotations).find(
    key => data.annotations[key]._key === markDefKey
  )
  if (!annotationKey) {
    throw new Error('Annotation not found in data')
  }
  // If this is a unset patch, remove the annotation
  if (patch.type === 'unset' && patch.path.length === 3) {
    delete data.annotations[annotationKey]
    // If no more annotations, unwrap the inline
    if (Object.keys(data.annotations).length === 0) {
      return change.unwrapInlineByKey(node.key)
    }
    return change.setNodeByKey(node.key, {data})
  }
  // Annotation is changed, update it's data
  if (snapshot && Array.isArray(snapshot)) {
    const block = snapshot.find(blk => blk._key && blk._key === blockKey)
    if (block && typeof block.markDefs === 'object' && Array.isArray(block.markDefs)) {
      data.annotations[annotationKey] = block.markDefs.find(
        def => def._key && def._key === markDefKey
      )
    }
  } else {
    const _patch = {...patch}
    _patch.path = patch.path.slice(2)
    const annotation = data.annotations[annotationKey]
    data.annotations[annotationKey] = applyAll([annotation], [_patch])[0]
  }
  return change.setNodeByKey(node.key, {data})
}

function patchBlockData(patch: Patch, change: () => void, type: Type, snapshot: ?JSONValue) {
  const doc = change.value.document
  const blockKey = patch.path[0]._key
  const block = doc.nodes.find(node => node.key === blockKey)
  // Only act on formbuilder blocks
  if (change.value.schema.isVoid(block)) {
    const data = block.data.toObject()
    // A gradient patch because snapshot, set value from there
    if (snapshot && Array.isArray(snapshot)) {
      data.value = snapshot.find(blk => blk._key && blk._key === blockKey)
    } else {
      // Do a simple formbuilderPatch
      const _patch = {...patch}
      _patch.path = _patch.path.slice(1)
      const newValue = applyAll(data.value, [_patch])
      data.value = newValue
    }
    change.setNodeByKey(block.key, {data})
  }
  return change
}

function patchInlineData(patch: Patch, change: () => void, type: Type, snapshot: ?JSONValue) {
  const doc = change.value.document
  const blockKey = patch.path[0]._key
  const inlineKey = patch.path[2]._key
  const block = doc.nodes.find(node => node.key === blockKey)
  const inline = block.nodes.find(
    node => node.data && node.data.get('value') && node.data.get('value')._key === inlineKey
  )
  const data = inline.data.toObject()
  // A gradient patch because snapshot, set value from there
  if (snapshot && Array.isArray(snapshot)) {
    const inlineBlock = snapshot.find(blk => blk._key && blk._key === blockKey)
    if (
      inlineBlock &&
      inlineBlock._type === 'block' &&
      inlineBlock.children &&
      typeof inlineBlock.children === 'object' &&
      Array.isArray(inlineBlock.children)
    ) {
      data.value = inlineBlock.children.find(child => child._key && child._key === inlineKey)
    }
  } else {
    // Do a simple formbuilderPatch
    const _patch = {...patch}
    _patch.path = _patch.path.slice(3)
    const newValue = applyAll(data.value, [_patch])
    data.value = newValue
  }
  change.setNodeByKey(inline.key, {data})
  return change
}

export default function patchesToChange(
  patches: Patch[],
  editorValue: Value,
  snapshot: ?JSONValue,
  type: Type
) {
  const change = editorValue.change()
  let result
  change.withoutNormalizing(_change => {
    // console.log('EDITORVALUE', JSON.stringify(editorValue.document.toJSON(VALUE_TO_JSON_OPTS), null, 2))
    // console.log('BLOCKS', JSON.stringify(snapshot, null, 2))
    // console.log('INITIAL CHANGE VALUE:', JSON.stringify(_change.value.toJSON(VALUE_TO_JSON_OPTS), null, 2))
    patches.forEach((patch: Patch) => {
      // console.log('INCOMING PATCH', JSON.stringify(patch, null, 2))
      // console.log('BEFORE VALUE:', JSON.stringify(_change.value.toJSON(VALUE_TO_JSON_OPTS), null, 2))
      if (patch.path.length > 1) {
        if (patch.path[1] === 'markDefs') {
          patchAnnotationData(patch, _change, type, snapshot)
        } else if (patch.path[1] === 'children' && patch.path.length > 3) {
          patchInlineData(patch, _change, type, snapshot)
        } else {
          patchBlockData(patch, _change, type, snapshot)
        }
      } else {
        switch (patch.type) {
          case 'set':
            setPatch(patch, _change, type)
            break
          case 'setIfMissing':
            setIfMissingPatch(patch, _change, type)
            break
          case 'insert':
            insertPatch(patch, _change, type)
            break
          case 'unset':
            unsetPatch(patch, _change)
            break
          default:
            replaceValue(snapshot, _change, type)
        }
      }
      // console.log('AFTER VALUE:', JSON.stringify(_change.value.toJSON(VALUE_TO_JSON_OPTS), null, 2))
      result = _change
    })
  })
  // console.log(result.value.document.nodes.get(1))
  // console.log('RESULT VALUE:', JSON.stringify(result.value.toJSON(VALUE_TO_JSON_OPTS), null, 2))
  return result
}
