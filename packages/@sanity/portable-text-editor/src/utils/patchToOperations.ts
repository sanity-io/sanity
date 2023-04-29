/* eslint-disable max-statements */
import {Editor, Transforms, Element, Path as SlatePath, Descendant, Text, Node} from 'slate'
import {
  applyPatches,
  cleanupEfficiency,
  makeDiff,
  parsePatch,
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
} from '@sanity/diff-match-patch'
import type {
  Path,
  KeyedSegment,
  PathSegment,
  PortableTextBlock,
  PortableTextChild,
  PortableTextSpan,
} from '@sanity/types'
import {isEqual} from 'lodash'
import type {Patch, InsertPatch, UnsetPatch, SetPatch, DiffMatchPatch} from '../types/patch'
import {applyAll} from '../patch/applyPatch'
import {PortableTextMemberSchemaTypes} from '../types/editor'
import {toSlateValue} from './values'
import {debugWithName} from './debug'
import {KEY_TO_SLATE_ELEMENT} from './weakMaps'

const debug = debugWithName('patchToOperations')

export function createPatchToOperations(
  schemaTypes: PortableTextMemberSchemaTypes
): (editor: Editor, patch: Patch) => boolean {
  let previousPatch: Patch | undefined

  return function (editor: Editor, patch: Patch): boolean {
    let changed = false

    // Save some CPU cycles by not stringifying unless enabled
    if (debug.enabled) {
      debug('\n\nNEW PATCH =============================================================')
      debug(JSON.stringify(patch, null, 2))
    }

    try {
      switch (patch.type) {
        case 'insert':
          changed = insertPatch(editor, patch, schemaTypes)
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

/**
 * Apply a remote diff match patch to the current PTE instance.
 * Note meant for external consumption, only exported for testing purposes.
 *
 * @param editor - Portable text slate editor instance
 * @param patch - The PTE diff match patch operation to apply
 * @returns true if the patch was applied, false otherwise
 * @internal
 */
export function diffMatchPatch(
  editor: Pick<Editor, 'children' | 'isTextBlock' | 'apply'>,
  patch: DiffMatchPatch
): boolean {
  const blockKey = findLastKey([patch.path[0]])
  const blockIndex = editor.children.findIndex((node, index) => {
    return blockKey ? node._key === blockKey : index === patch.path[0]
  })
  const block = editor.children[blockIndex] as Element | undefined
  const isSpanTextDiffMatchPatch =
    block &&
    editor.isTextBlock(block) &&
    patch.path.length === 4 &&
    patch.path[1] === 'children' &&
    patch.path[3] === 'text'

  if (!isSpanTextDiffMatchPatch) {
    return false
  }

  const childKey = findLastKey([patch.path[2]])
  const childIndex = block.children.findIndex((node, index) => {
    return childKey ? node._key === childKey : index === patch.path[0]
  })

  if (childIndex === -1) {
    // @todo in which cases does this ever happen? is it acceptable to skip?
    return false
  }

  const slatePath = [blockIndex, childIndex]
  const child: PortableTextSpan = block.children[childIndex] as PortableTextSpan

  const patches = parsePatch(patch.value)
  const [newValue] = applyPatches(patches, child.text)
  const diff = cleanupEfficiency(makeDiff(child.text, newValue), 5)

  debugState(editor, 'before')
  let offset = 0
  for (const [op, text] of diff) {
    if (op === DIFF_INSERT) {
      editor.apply({type: 'insert_text', path: slatePath, offset, text})
      offset += text.length
    } else if (op === DIFF_DELETE) {
      editor.apply({type: 'remove_text', path: slatePath, offset: offset, text})
    } else if (op === DIFF_EQUAL) {
      offset += text.length
    }
  }

  debugState(editor, 'after')

  return true
}

function insertPatch(
  editor: Editor,
  patch: InsertPatch,
  schemaTypes: PortableTextMemberSchemaTypes
) {
  // Insert blocks
  if (patch.path.length === 1) {
    const {items, position} = patch
    const blocksToInsert = toSlateValue(
      items as PortableTextBlock[],
      {schemaTypes},
      KEY_TO_SLATE_ELEMENT.get(editor)
    ) as Descendant[]
    const posKey = findLastKey(patch.path)
    const index = Math.max(
      0,
      editor.children.findIndex((node, indx) => {
        return posKey ? node._key === posKey : indx === patch.path[0]
      })
    )
    const normalizedIdx = position === 'after' ? index + 1 : index
    debug(`Inserting blocks at path [${normalizedIdx}]`)
    debugState(editor, 'before')
    Transforms.insertNodes(editor, blocksToInsert, {at: [normalizedIdx]})
    debugState(editor, 'after')
    return true
  }
  const {items, position} = patch
  const posKey = findLastKey(patch.path)
  const blockIndex = editor.children.findIndex((node, indx) => {
    return posKey ? node._key === posKey : indx === patch.path[0]
  })

  // Insert children
  const block: Descendant | undefined =
    editor.children && blockIndex > -1 ? editor.children[blockIndex] : undefined
  const childIndex = editor.isTextBlock(block)
    ? block.children.findIndex((node: PortableTextChild, indx: number) => {
        return isKeyedSegment(patch.path[2])
          ? node._key === patch.path[2]._key
          : indx === patch.path[2]
      })
    : 0
  const childrenToInsert =
    block &&
    toSlateValue(
      [{...block, children: items as PortableTextChild[]}],
      {schemaTypes},
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
    return isKeyedSegment(patch.path[0]) ? node._key === patch.path[0]._key : indx === patch.path[0]
  })
  debug('blockIndex', blockIndex)
  const block = blockIndex > -1 ? editor.children[blockIndex] : undefined
  const isTextBlock = editor.isTextBlock(block)

  // Ignore patches targeting nested void data, like 'markDefs'
  if (isTextBlock && patch.path.length > 2 && patch.path[1] !== 'children') {
    debug('Ignoring setting void value')
    return false
  }

  const childIndex = isTextBlock
    ? block.children.findIndex((node: PortableTextChild, indx: number) => {
        return isKeyedSegment(patch.path[2])
          ? node._key === patch.path[2]._key
          : indx === patch.path[2]
      })
    : 0
  let value = patch.value
  const targetPath: SlatePath = childIndex > -1 ? [blockIndex, childIndex] : [blockIndex]
  if (typeof patch.path[3] === 'string') {
    value = {}
    value[patch.path[3]] = patch.value
  }
  if (isTextBlock) {
    // Save some CPU cycles by not stringifying unless enabled
    if (debug.enabled) {
      debug(`Setting nodes at ${JSON.stringify(patch.path)} - ${JSON.stringify(targetPath)}`)
      debug('Value to set', JSON.stringify(value, null, 2))
    }

    debugState(editor, 'before')
    if (targetPath.length === 1) {
      debug('Setting block property')
      const {children, ...nextRest} = value as PortableTextBlock
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
    } else if (Text.isText(value)) {
      debug('Setting text property')
      const prevSel = editor.selection && {...editor.selection}
      editor.apply({
        type: 'remove_text',
        path: targetPath,
        offset: 0,
        text: block.children[childIndex].text as string,
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
        newProperties: value as Partial<Node>,
      })
    }
    debugState(editor, 'after')
    return true
  }
  // If this is a object block, just set the whole block
  else if (block && 'value' in block) {
    const newVal = applyAll([block.value], [patch])[0]
    Transforms.setNodes(editor, {...block, value: newVal}, {at: [blockIndex]})
    return true
  }
  return false
}

function unsetPatch(editor: Editor, patch: UnsetPatch, previousPatch?: Patch) {
  // Value
  if (patch.path.length === 0) {
    debug('Removing everything')
    debugState(editor, 'before')
    const previousSelection = editor.selection
    Transforms.deselect(editor)
    editor.children.forEach((c, i) => {
      Transforms.removeNodes(editor, {at: [i]})
    })
    Transforms.insertNodes(editor, editor.createPlaceholderBlock())
    if (previousSelection) {
      Transforms.select(editor, {
        anchor: {path: [0, 0], offset: 0},
        focus: {path: [0, 0], offset: 0},
      })
    }
    debugState(editor, 'after')
    return true
  }
  // Single blocks
  if (patch.path.length === 1) {
    const lastKey = findLastKey(patch.path)
    const index = editor.children.findIndex((node, indx) =>
      lastKey ? node._key === lastKey : indx === patch.path[0]
    )
    if (index === -1) {
      debug(`Could not find block to unset at path ${JSON.stringify(patch.path)}`)
      return false
    }
    debug(`Removing block at path [${index}]`)
    debugState(editor, 'before')
    if (
      editor.selection &&
      editor.selection.focus.path[0] === index &&
      editor.children[index - 1]
    ) {
      const point = {path: [Math.max(editor.selection.focus.path[0] - 1, 0)], offset: 0}
      Transforms.select(editor, {focus: point, anchor: point})
      Transforms.move(editor, {unit: 'line'})
    }
    Transforms.removeNodes(editor, {at: [index]})
    debugState(editor, 'after')
    return true
  }

  const blockIndex = editor.children.findIndex((node, indx) => {
    return isKeyedSegment(patch.path[0]) ? node._key === patch.path[0]._key : indx === patch.path[0]
  })

  const block = blockIndex > -1 ? editor.children[blockIndex] : undefined

  // Unset on text block children
  if (editor.isTextBlock(block) && patch.path[1] === 'children' && patch.path.length === 3) {
    const childIndex = block.children.findIndex((node: PortableTextChild, indx: number) => {
      return isKeyedSegment(patch.path[2])
        ? node._key === patch.path[2]._key
        : indx === patch.path[2]
    })
    const targetPath = [blockIndex, childIndex]
    const prevSel = editor.selection && {...editor.selection}
    const onSamePath = isEqual(editor.selection?.focus.path, targetPath)
    if (childIndex === -1) {
      debug(`Could not find child to unset at path ${JSON.stringify(targetPath)}`)
      return false
    }
    debug(`Unsetting child at path ${JSON.stringify(targetPath)}`)
    debugState(editor, 'before')
    if (prevSel && onSamePath && editor.isTextBlock(block)) {
      const needToAdjust = childIndex >= prevSel.focus.path[1]
      if (needToAdjust) {
        const textChild = block.children[childIndex]
        const isMergeUnset =
          previousPatch?.type === 'set' &&
          previousPatch.path[3] === 'text' &&
          typeof previousPatch.value === 'string' &&
          editor.isTextSpan(textChild) &&
          isEqual(
            previousPatch.value.slice(-textChild.text.length),
            block.children[childIndex].text
          )
        if (isMergeUnset) {
          const mergedChild = block.children[Math.max(childIndex - 1, 0)]
          debug('Adjusting selection for merging of nodes')
          prevSel.focus = {...prevSel.focus}
          prevSel.focus.path = [targetPath[0], Math.max(targetPath[1] - 1, 0)]
          prevSel.focus.offset = editor.isTextSpan(mergedChild)
            ? mergedChild.text.length - textChild.text.length + prevSel.focus.offset
            : 0
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
  return false
}

function isKeyedSegment(segment: PathSegment): segment is KeyedSegment {
  return typeof segment === 'object' && '_key' in segment
}

// Helper function to find the last part of a patch path that has a known key
function findLastKey(path: Path): string | null {
  let key: string | null = null

  // @todo why does this find the _last_ part?
  // if the path is root -> block -> span -> text,
  // won't this return the block key?
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

function debugState(editor: Partial<Pick<Editor, 'children' | 'selection'>>, stateName: string) {
  if (!debug.enabled) {
    return
  }

  debug(`Children ${stateName}:`, JSON.stringify(editor.children, null, 2))
  debug(`Selection ${stateName}: `, JSON.stringify(editor.selection, null, 2))
}
