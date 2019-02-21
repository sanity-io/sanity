// @flow

import {blocksToEditorValue} from '@sanity/block-tools'
import {Selection, Text, Mark} from 'slate'
import {isEqual, isString} from 'lodash'

import type {
  BlockContentFeatures,
  Path,
  SlateEditor,
  SlateNode,
  SlateValue,
  Type
} from '../typeDefs'
import type {
  Patch,
  SetPatch,
  DiffMatchPatch,
  InsertPatch,
  UnsetPatch,
  SetIfMissingPatch
} from '../../../typedefs/patch'

import apply, {applyAll} from '../../../simplePatch'
import findInlineByAnnotationKey from './findInlineByAnnotationKey'
import createSelectionOperation from './createSelectionOperation'
import createEditorController from './createEditorController'
import buildEditorSchema from './buildEditorSchema'
import createEmptyBlock from './createEmptyBlock'

type JSONValue = number | string | boolean | {[string]: JSONValue} | JSONValue[]

function findLastKey(path: Path[]) {
  let key = null
  path.forEach(part => {
    if (part._key) {
      key = part._key
    }
  })
  return key
}

function findEditorChildNodeFromBlockChildKey(blockNode: SlateNode, childKey: Path) {
  if (!blockNode) {
    throw new Error('No blockNode given!')
  }
  let count = -1
  const targetIndex = blockNode.nodes.findIndex(node => {
    if (node.object === 'text') {
      for (let i = 0; i < node.leaves.size; i++) {
        count++
        // eslint-disable-next-line max-depth
        if (`${blockNode.key}${count}` === childKey) {
          break
        }
      }
    } else {
      count++
    }
    return `${blockNode.key}${count}` === childKey
  })
  return blockNode.nodes.get(targetIndex)
}

function getBlockTextIndex(blockNode: SlateNode, childNode: SlateNode) {
  let positionCount = -1
  blockNode.nodes.some(cNode => {
    if (cNode.key === childNode.key) {
      positionCount++
      return true
    }
    if (cNode.object === 'text') {
      positionCount += cNode.leaves.size
    } else {
      positionCount++
    }
    return false
  })
  return positionCount
}

export default function createPatchesToChange(
  blockContentFeatures: BlockContentFeatures,
  blockContentType: Type
) {
  const schema = buildEditorSchema(blockContentFeatures, {withNormalization: false})
  const controller = createEditorController({
    value: null,
    plugins: [{schema}]
  })

  function setPatch(patch: SetPatch, editor: SlateEditor) {
    if (Array.isArray(patch.value)) {
      if (patch.path.length === 0) {
        return replaceValue(patch.value, editor)
      }
      throw new Error(`Invalid patch, looks like it should be an insert: ${JSON.stringify(patch)}`)
    }
    const editorBlock = blocksToEditorValue([patch.value], blockContentType).document.nodes[0]
    const key = findLastKey(patch.path)
    editor.replaceNodeByKey(key, editorBlock)
    return editor.operations
  }

  function setIfMissingPatch(patch: SetIfMissingPatch, editor: SlateEditor) {
    if (patch.path.length === 0) {
      if (editor.value.document.nodes.size === 0) {
        return replaceValue(patch.value, editor)
      }
      return editor.operations
    }
    const doc = editor.value.document
    const blockKey = patch.path[0]._key
    const block = doc.nodes.find(node => node.key === blockKey)
    if (editor.query('isVoid', block)) {
      const data = block.data.toObject()
      if (!data.value) {
        const newData = {...data, value: patch.value}
        editor.setNodeByKey(blockKey, {data: newData})
      }
    }
    return editor.operations
  }

  function insertPatch(patch: InsertPatch, editor: SlateEditor) {
    const {items, position} = patch
    const blocksToInsert = blocksToEditorValue(items, blockContentType)
    const posKey = findLastKey(patch.path)
    let index = editor.value.document.nodes.findIndex((node, indx) => {
      return posKey ? node.key === posKey : indx === patch.path[0]
    })
    if (position === 'before') {
      index = index > 0 ? index-- : index
    }
    if (position === 'after') {
      index++
    }
    blocksToInsert.document.nodes.forEach(block => {
      editor.applyOperation({
        type: 'insert_node',
        path: [index++],
        node: block
      })
    })
    return editor.operations
  }

  function unsetPatch(patch: UnsetPatch, editor: SlateEditor) {
    // Deal with patches unsetting the whole field
    if (patch.path.length === 0) {
      editor.value.document.nodes.forEach(node => {
        editor.applyOperation({
          type: 'remove_node',
          path: [0],
          node: node
        })
      })
      // Create a placeholder block and set focus
      const block = createEmptyBlock(blockContentFeatures)
      const node = block.toJSON({preserveKeys: true, preserveData: true})
      node.data = {...node.data, placeholder: true}
      editor.applyOperation({
        type: 'insert_node',
        path: [0],
        node: node
      })
      editor.focus()
      return editor.operations
    }
    // Deal with patches unsetting something inside
    const lastKey = findLastKey(patch.path)
    if (lastKey && editor.value.document.getDescendant(lastKey)) {
      editor.removeNodeByKey(lastKey)
    }
    return editor.operations
  }

  function replaceValue(snapshot: ?JSONValue, editor: SlateEditor) {
    // console.log('Replacing value')
    if (snapshot) {
      const fragment = blocksToEditorValue(snapshot, blockContentType)
      // Store the old selection
      const select = createSelectionOperation(editor)
      editor.value.document.nodes.forEach(node => {
        editor.applyOperation({
          type: 'remove_node',
          path: [0],
          node: node
        })
      })
      fragment.document.nodes.reverse().forEach(node => {
        editor.applyOperation({
          type: 'insert_node',
          path: [0],
          node: node
        })
      })
      // Restore the old selection
      editor.applyOperation(select)
      return editor.operations
    }
    throw new Error('No snapshot given!')
  }

  // eslint-disable-next-line complexity
  function patchAnnotationData(patch: Patch, editor: SlateEditor) {
    const doc = editor.value.document
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
        editor.unwrapInlineByKey(node.key)
        return editor.operations
      }
      editor.setNodeByKey(node.key, {data})
      return editor.operations
    }
    const _patch = {...patch}
    _patch.path = patch.path.slice(2)
    const annotation = data.annotations[annotationKey]
    data.annotations[annotationKey] = applyAll([annotation], [_patch])[0]
    editor.setNodeByKey(node.key, {data})
    return editor.operations
  }

  function patchBlockData(patch: Patch, editor: SlateEditor) {
    const doc = editor.value.document
    const blockKey = patch.path[0]._key
    const block = doc.nodes.find(node => node.key === blockKey)
    // Only act on void formBuilder blocks
    if (editor.query('isVoid', block)) {
      const data = block.data.toObject()
      const _patch = {...patch}
      _patch.path = _patch.path.slice(1)
      const newValue = applyAll(data.value, [_patch])
      data.value = newValue
      editor.setNodeByKey(block.key, {data})
    }
    return editor.operations
  }

  function patchInlineData(patch: Patch, editor: SlateEditor, inline: SlateNode) {
    const data = inline.data.toObject()
    const _patch = {...patch}
    _patch.path = _patch.path.slice(3)
    const newValue = applyAll(data.value, [_patch])
    data.value = newValue
    editor.setNodeByKey(inline.key, {data})
    return editor.operations
  }

  function rebasePatch(patch: SetPatch, editor: SlateEditor) {
    if (
      !editor.value.selection.isFocused ||
      !Array.isArray(patch.value) ||
      patch.value.length === 0
    ) {
      return replaceValue(patch.value, editor)
    }
    // We must modify the selection' paths!
    const focusBlockKey = editor.value.focusBlock.key
    const anchorBlockKey = editor.value.anchorBlock.key
    const focusPath = editor.value.document.assertPath(focusBlockKey)
    const anchorPath = editor.value.document.assertPath(anchorBlockKey)
    const oldFocusBlockIndex = focusPath.get(0)
    const oldAnchorBlockIndex = anchorPath.get(0)
    const newFocusBlockIndex = patch.value.findIndex(blk => blk._key === focusBlockKey)
    const newAnchorBlockIndex = patch.value.findIndex(blk => blk._key === anchorBlockKey)
    if (newFocusBlockIndex !== oldFocusBlockIndex || newAnchorBlockIndex !== oldAnchorBlockIndex) {
      // console.log('Modifying selection and replacing value')
      const selection = editor.value.selection.toJSON()
      selection.anchor.path = [newAnchorBlockIndex, ...selection.anchor.path.slice(1)]
      selection.focus.path = [newFocusBlockIndex, ...selection.focus.path.slice(1)]
      replaceValue(patch.value, editor)
      editor.select(Selection.fromJSON(selection))
      return editor.operations
    }
    // console.log('Replacing value because rebase')
    return replaceValue(patch.value, editor)
  }

  // eslint-disable-next-line complexity
  function patchSpanText(
    patch: InsertPatch | SetPatch | DiffMatchPatch,
    editor: SlateEditor,
    node: SlateNode,
    blockNode: SlateNode
  ) {
    const textPath = editor.value.document.assertPath(node.key)
    const blockKey = patch.path[0]._key
    const childKey = findLastKey(patch.path)
    const workTextNode = node.toJSON({preserveKeys: true})
    const blockIndex = getBlockTextIndex(blockNode, node)
    const leafIndex = workTextNode.leaves.findIndex(
      (leaf, index) => `${blockKey}${blockIndex + index}` === childKey
    )

    // Insert patches for new spans
    if (patch.type === 'insert') {
      let targetIndex = leafIndex
      if (patch.position === 'before') {
        targetIndex--
      }
      const newLeaves = []
      workTextNode.leaves.forEach((leaf, index) => {
        if (targetIndex === index) {
          newLeaves.push(leaf)
          patch.items.forEach(item => {
            const newLeaf = {
              text: item.text,
              marks: Mark.createSet(item.marks.map(mark => ({type: mark})))
            }
            newLeaves.push(newLeaf)
          })
        } else {
          newLeaves.push(leaf)
        }
      })
      workTextNode.leaves = newLeaves
      // Replace it
      editor.replaceNodeByPath(textPath, Text.fromJSON(workTextNode))
      return editor.operations
    }

    // Set patches patching either string values or span objects
    if (patch.type === 'set') {
      const valueIsString = isString(patch.value)
      const patchText = valueIsString ? patch.value : patch.value.text
      // If single leaf, we can just replace the text with the current marks
      if (node.leaves.size === 1) {
        let marks
        // eslint-disable-next-line max-depth
        if (valueIsString) {
          marks = node.leaves.map(leaf => leaf.marks).get(0)
        } else {
          marks = Mark.createSet(patch.value.marks.map(mark => ({type: mark})))
        }
        editor.replaceNodeByPath(textPath, Text.create({text: patchText, marks}))
        return editor.operations
      }

      // Build the new text
      workTextNode.leaves[leafIndex] = {
        object: 'leaf',
        text: patchText,
        marks: valueIsString
          ? node.leaves.get(leafIndex).marks
          : Mark.createSet(patch.value.marks.map(mark => ({type: mark})))
      }
      // Replace it
      editor.replaceNodeByPath(textPath, Text.fromJSON(workTextNode))
      return editor.operations
    }

    // DiffMatch patches for existing spans text value
    if (patch.type === 'diffMatchPatch') {
      const marks = workTextNode.leaves[leafIndex].marks
      workTextNode.leaves[leafIndex] = {
        object: 'leaf',
        text: apply(workTextNode.leaves[leafIndex].text, {...patch, path: []}),
        marks
      }
      // Replace it
      editor.replaceNodeByPath(textPath, Text.fromJSON(workTextNode))
      return editor.operations
    }
    throw new Error(`Don't know how to handle ${patch.type} here`)
  }

  // eslint-disable-next-line complexity
  return function patchToOperations(patch: Patch, editorValue: SlateValue) {
    controller.flush() // Must flush here or we end up with duplicate operations
    controller.setValue(editorValue)

    if (patch.origin === 'internal' && patch.type === 'set' && isEqual(patch.path, [])) {
      return rebasePatch(patch, controller)
    }

    // Patches working on markDefs or inside blocks
    if (patch.path.length > 1) {
      if (patch.path[1] === 'markDefs') {
        return patchAnnotationData(patch, controller)
      } else if (patch.path[1] === 'children' && patch.path.length >= 3) {
        // Find the node (keys can be random on the working document)
        const blockNode = controller.value.document.getNode(patch.path[0]._key)
        const node = findEditorChildNodeFromBlockChildKey(blockNode, findLastKey(patch.path))
        // eslint-disable-next-line max-depth
        if (!node) {
          throw new Error('Could not find childNode')
        }
        const isVoid = controller.query('isVoid', node)
        // eslint-disable-next-line max-depth
        if (isVoid) {
          return patchInlineData(patch, controller, node)
        }
        // eslint-disable-next-line max-depth
        if (patch.type === 'insert' || patch.type === 'set' || patch.type === 'diffMatchPatch') {
          return patchSpanText(patch, controller, node, blockNode)
        }
      }
      return patchBlockData(patch, controller)
    }
    // Patches working on whole blocks or document
    switch (patch.type) {
      case 'set':
        return setPatch(patch, controller)
      case 'setIfMissing':
        return setIfMissingPatch(patch, controller)
      case 'insert':
        return insertPatch(patch, controller)
      case 'unset':
        return unsetPatch(patch, controller)
      default:
        throw new Error(`Don't know how to handle the patch ${patch.type}`)
    }
  }
}
