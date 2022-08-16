/* eslint-disable max-statements */
import {Editor, Transforms, Element, Path as SlatePath, Descendant} from 'slate'
import * as DMP from 'diff-match-patch'
import {Path, KeyedSegment, PathSegment} from '@sanity/types'
import {isEqual} from 'lodash'
import type {Patch, InsertPatch, UnsetPatch, SetPatch, DiffMatchPatch} from '../types/patch'
import {PortableTextFeatures, PortableTextBlock, PortableTextChild} from '../types/portableText'
import {applyAll} from '../patch/applyPatch'
import {isEqualToEmptyEditor, toSlateValue} from './values'
import {debugWithName} from './debug'
import {KEY_TO_SLATE_ELEMENT} from './weakMaps'

const debug = debugWithName('operationToPatches')

// eslint-disable-next-line new-cap
const dmp = new DMP.diff_match_patch()

export function createPatchToOperations(
  portableTextFeatures: PortableTextFeatures,
  keyGenerator: () => string
): (
  editor: Editor,
  patch: Patch,
  patches: Patch[],
  snapshot: PortableTextBlock[] | undefined
) => boolean {
  function diffMatchPatch(editor: Editor, patch: DiffMatchPatch) {
    const blockKey = findLastKey([patch.path[0]])
    const blockIndex = editor.children.findIndex((node, indx) => {
      return blockKey ? node._key === blockKey : indx === patch.path[0]
    })
    const block = editor.children[blockIndex] as Element
    const childKey = findLastKey([patch.path[2]])
    const childIndex = block.children.findIndex((node, indx) => {
      return childKey ? node._key === childKey : indx === patch.path[0]
    })
    const parsed = dmp.patch_fromText(patch.value)[0]
    if (parsed) {
      const slatePath = [blockIndex, childIndex]
      const distance = parsed.length2 - parsed.length1
      const point = {
        path: slatePath,
        offset:
          distance >= 0
            ? (parsed.start1 || 0) + parsed.diffs[0][1].length
            : (parsed.start2 || 0) + parsed.length2 - distance,
      }
      debug(
        `DiffMatchPatch (${distance < 0 ? 'remove' : 'insert'}) at ${JSON.stringify(slatePath)}}: `,
        JSON.stringify(point, null, 2),
        JSON.stringify(parsed, null, 2)
      )
      debugState(editor, 'before')

      let text
      if (parsed.diffs[1]) {
        text = parsed.diffs[1][1]
      } else {
        text = parsed.diffs[0][1]
      }
      debug(`Text: '${text}'`)
      if (distance >= 0) {
        editor.apply({
          type: 'insert_text',
          path: point.path,
          offset: point.offset,
          text,
        })
      } else {
        editor.apply({
          type: 'remove_text',
          path: point.path,
          offset: point.offset - text.length,
          text,
        })
      }
      debugState(editor, 'after')
    }
    return true
  }

  function insertPatch(editor: Editor, patch: InsertPatch) {
    // Insert blocks
    if (patch.path.length === 1) {
      const {items, position} = patch
      const blocksToInsert = toSlateValue(
        items as PortableTextBlock[],
        {portableTextFeatures},
        KEY_TO_SLATE_ELEMENT.get(editor)
      ) as Descendant[]
      const posKey = findLastKey(patch.path)
      const index = editor.children.findIndex((node, indx) => {
        return posKey ? node._key === posKey : indx === patch.path[0]
      })
      const normalizedIdx = position === 'after' ? index + 1 : index
      debug(`Inserting blocks at path [${normalizedIdx}]`)
      debugState(editor, 'before')
      const isEmpty = isEqualToEmptyEditor(editor.children, portableTextFeatures)
      debug('isEmpty', isEmpty)
      if (isEmpty) {
        debug('Removing placeholder block')
        Transforms.removeNodes(editor, {at: [0]})
      }
      Transforms.insertNodes(editor, blocksToInsert, {at: [normalizedIdx]})
      if (isEmpty) {
        Transforms.select(editor, {
          focus: {path: [0, 0], offset: 0},
          anchor: {path: [0, 0], offset: 0},
        })
      }
      debugState(editor, 'after')
      return true
    }
    const {items, position} = patch
    const posKey = findLastKey(patch.path)
    const blockIndex = editor.children.findIndex((node, indx) => {
      return posKey ? node._key === posKey : indx === patch.path[0]
    })

    // Insert children
    const block: PortableTextBlock | undefined =
      editor.children && blockIndex > -1 ? editor.children[blockIndex] : undefined
    const childIndex =
      block &&
      block.children.findIndex((node: PortableTextChild, indx: number) => {
        return isKeyedSegment(patch.path[2])
          ? node._key === patch.path[2]._key
          : indx === patch.path[2]
      })
    const childrenToInsert =
      block &&
      toSlateValue(
        [{...block, children: items as PortableTextChild[]}],
        {portableTextFeatures},
        KEY_TO_SLATE_ELEMENT.get(editor)
      )

    const normalizedIdx = position === 'after' ? childIndex + 1 : childIndex
    const targetPath = [blockIndex, normalizedIdx]
    debug(`Inserting children at path ${targetPath}`)
    debugState(editor, 'before')
    if (childrenToInsert && Element.isElement(childrenToInsert[0])) {
      Transforms.insertNodes(editor, childrenToInsert[0].children, {at: targetPath})
    }
    debugState(editor, 'after')
    return true
  }

  function setPatch(editor: Editor, patch: SetPatch) {
    const blockIndex = editor.children.findIndex((node, indx) => {
      return isKeyedSegment(patch.path[0])
        ? node._key === patch.path[0]._key
        : indx === patch.path[0]
    })
    debug('blockIndex', blockIndex)
    const block: PortableTextBlock | undefined =
      blockIndex > -1 ? editor.children[blockIndex] : undefined
    const childIndex =
      block &&
      block.children.findIndex((node: PortableTextChild, indx: number) => {
        return isKeyedSegment(patch.path[2])
          ? node._key === patch.path[2]._key
          : indx === patch.path[2]
      })
    let value: any = patch.value
    const targetPath: SlatePath = childIndex > -1 ? [blockIndex, childIndex] : [blockIndex]
    if (typeof patch.path[3] === 'string') {
      value = {}
      value[patch.path[3]] = patch.value
    }
    const isTextBlock = portableTextFeatures.types.block.name === block?._type
    if (isTextBlock) {
      debug(`Setting nodes at ${JSON.stringify(patch.path)} - ${JSON.stringify(targetPath)}`)
      debug('Value to set', JSON.stringify(value, null, 2))
      debugState(editor, 'before')
      if (targetPath.length === 1) {
        debug('Setting block property')
        const {children, ...nextRest} = value
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {children: prevChildren, ...prevRest} = block || {children: undefined}
        editor.apply({
          type: 'set_node',
          path: targetPath,
          properties: {...prevRest},
          newProperties: nextRest,
        })
        if (block && Element.isElement(block)) {
          block.children.forEach((c, cIndex) => {
            editor.apply({
              type: 'remove_node',
              path: targetPath.concat(cIndex),
              node: c,
            })
          })
        }
        if (Array.isArray(children)) {
          children.forEach((c, cIndex) => {
            editor.apply({
              type: 'insert_node',
              path: targetPath.concat(cIndex),
              node: c,
            })
          })
        }
      } else if (typeof value.text === 'string') {
        debug('Setting text property')
        const prevSel = editor.selection && {...editor.selection}
        editor.apply({
          type: 'remove_text',
          path: targetPath,
          offset: 0,
          text: block?.children[childIndex].text,
        })
        editor.apply({
          type: 'insert_text',
          path: targetPath,
          offset: 0,
          text: value.text,
        })
        const onSamePath = prevSel && isEqual(prevSel.focus.path, targetPath)
        // const onSameText =
        //   editor.selection &&
        //   editor.selection.focus.path[0] === blockIndex &&
        //   patch.path[3] === 'text'
        if (onSamePath) {
          debug('On same path, restoring previous selection')
          Transforms.select(editor, prevSel)
        }
        //  else if (onSameText) {
        //   debug('Adjusting for inserted text')
        //   const newOffset = typeof patch.value === 'string' ? patch.value.length : 0
        //   const point = {path: targetPath, offset: newOffset}
        //   Transforms.select(editor, {focus: point, anchor: point})
        // }
      } else {
        debug('Setting non-text property')
        editor.apply({
          type: 'set_node',
          path: targetPath,
          properties: {},
          newProperties: value,
        })
      }
      debugState(editor, 'after')
      return true
    }
    // If this is a object block, just set the whole block
    else if (!isTextBlock && block) {
      const newVal = applyAll([block.value], [patch])[0]
      Transforms.setNodes(editor, {...block, value: newVal}, {at: [blockIndex]})
      return true
    }
    return false
  }

  function unsetPatch(editor: Editor, patch: UnsetPatch, previousPatch?: Patch) {
    // Value
    if (patch.path.length === 0) {
      debug(`Removing everything`)
      debugState(editor, 'before')
      editor.children.forEach((c, i) => {
        Transforms.removeNodes(editor, {at: [i]})
      })
      Transforms.insertNodes(editor, editor.createPlaceholderBlock(), {at: [0]})
      Transforms.select(editor, {
        focus: {path: [0, 0], offset: 0},
        anchor: {path: [0, 0], offset: 0},
      })
      debugState(editor, 'after')
      return true
    }
    // Single blocks
    if (patch.path.length === 1) {
      const lastKey = findLastKey(patch.path)
      const index = editor.children.findIndex((node, indx) =>
        lastKey ? node._key === lastKey : indx === patch.path[0]
      )
      if (index > -1) {
        debug(`Removing block at path [${index}]`)
        debugState(editor, 'before')
        if (editor.selection && editor.selection.focus.path[0] === index) {
          const point = {path: [editor.selection.focus.path[0] - 1 || 0], offset: 0}
          Transforms.select(editor, {focus: point, anchor: point})
          Transforms.move(editor, {unit: 'line'})
        }
        Transforms.removeNodes(editor, {at: [index]})
        debugState(editor, 'after')
        return true
      }
    }

    const blockIndex = editor.children.findIndex((node, indx) => {
      return isKeyedSegment(patch.path[0])
        ? node._key === patch.path[0]._key
        : indx === patch.path[0]
    })

    const block: PortableTextBlock | undefined =
      blockIndex > -1 ? editor.children[blockIndex] : undefined

    const isTextBlock = portableTextFeatures.types.block.name === block?._type

    // Unset on text block children
    if (isTextBlock && patch.path[1] === 'children' && patch.path.length === 3) {
      const childIndex =
        block &&
        block.children.findIndex((node: PortableTextChild, indx: number) => {
          return isKeyedSegment(patch.path[2])
            ? node._key === patch.path[2]._key
            : indx === patch.path[2]
        })
      const targetPath = [blockIndex, childIndex]
      const prevSel = editor.selection && {...editor.selection}
      const onSamePath = isEqual(editor.selection?.focus.path, targetPath)

      debug(`Removing child at path ${JSON.stringify(targetPath)}`)
      debugState(editor, 'before')
      if (prevSel && onSamePath && editor.isTextBlock(block)) {
        const needToAdjust = childIndex >= prevSel.focus.path[1]
        if (needToAdjust) {
          const isMergeUnset =
            previousPatch?.type === 'set' &&
            previousPatch.path[3] === 'text' &&
            typeof previousPatch.value === 'string' &&
            isEqual(
              previousPatch.value.slice(-block.children[childIndex].text.length),
              block.children[childIndex].text
            )
          if (isMergeUnset) {
            debug('Adjusting selection for merging of nodes')
            prevSel.focus = {...prevSel.focus}
            prevSel.focus.path = [targetPath[0], targetPath[1] - 1]
            prevSel.focus.offset =
              block.children[childIndex - 1].text.length -
              block.children[childIndex].text.length +
              prevSel.focus.offset
            prevSel.anchor = prevSel.focus
            Transforms.select(editor, prevSel)
            Transforms.removeNodes(editor, {at: [blockIndex, childIndex]})
            debugState(editor, 'after')
            return true
          }
        }
      }
      Transforms.removeNodes(editor, {at: [blockIndex, childIndex]})
      debugState(editor, 'after')
      return true
    }
    // Inside block objects - patch block and set it again
    if (!isTextBlock && block) {
      const newBlock = applyAll([block], [patch])[0]
      Transforms.setNodes(editor, newBlock, {at: [blockIndex]})
      return true
    }
    return false
  }

  let previousPatch: Patch | undefined

  return function (editor: Editor, patch: Patch): boolean {
    let changed = false
    debug('\n\nNEW PATCH =============================================================')
    debug(JSON.stringify(patch, null, 2))
    try {
      switch (patch.type) {
        case 'insert':
          changed = insertPatch(editor, patch)
          break
        case 'unset':
          changed = unsetPatch(editor, patch, previousPatch)
          break
        case 'set':
          changed = setPatch(editor, patch)
          break
        case 'diffMatchPatch':
          changed = diffMatchPatch(editor, patch)
          break
        default:
          debug('Unhandled patch', patch.type)
      }
    } catch (err) {
      console.error(err)
    }
    previousPatch = patch
    return changed
  }
}

function isKeyedSegment(segment: PathSegment): segment is KeyedSegment {
  return typeof segment === 'object' && '_key' in segment
}

// Helper function to find the last part of a patch path that has a known key
function findLastKey(path: Path) {
  let key: string | null = null

  path
    .concat('')
    .reverse()
    .forEach((part) => {
      if (isKeyedSegment(part)) {
        key = part._key
      }
    })

  return key
}

function debugState(editor: Editor, stateName: string) {
  debug(`Children ${stateName}:`, JSON.stringify(editor.children, null, 2))
  debug(`Selection ${stateName}: `, JSON.stringify(editor.selection, null, 2))
}
