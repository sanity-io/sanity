/* eslint-disable max-statements */
import {Transforms, Element, Path as SlatePath, Descendant, Text, Node} from 'slate'
import {
  applyPatches as diffMatchPatchApplyPatches,
  cleanupEfficiency,
  makeDiff,
  parsePatch,
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
} from '@sanity/diff-match-patch'
import {
  type Path,
  type KeyedSegment,
  type PathSegment,
  type PortableTextBlock,
  type PortableTextChild,
} from '@sanity/types'
import type {Patch, InsertPatch, UnsetPatch, SetPatch, DiffMatchPatch} from '../types/patch'
import {applyAll} from '../patch/applyPatch'
import {PortableTextMemberSchemaTypes, PortableTextSlateEditor} from '../types/editor'
import {toSlateValue} from './values'
import {debugWithName} from './debug'
import {KEY_TO_SLATE_ELEMENT} from './weakMaps'

const debug = debugWithName('applyPatches')
const debugVerbose = debug.enabled && true

/**
 * Creates a function that can apply a patch onto a PortableTextSlateEditor.
 */
export function createApplyPatch(
  schemaTypes: PortableTextMemberSchemaTypes
): (editor: PortableTextSlateEditor, patch: Patch) => boolean {
  let previousPatch: Patch | undefined

  return function (editor: PortableTextSlateEditor, patch: Patch): boolean {
    let changed = false

    // Save some CPU cycles by not stringifying unless enabled
    if (debugVerbose) {
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
  editor: Pick<
    PortableTextSlateEditor,
    'children' | 'isTextBlock' | 'apply' | 'selection' | 'onChange'
  >,
  patch: DiffMatchPatch
): boolean {
  const {block, child, childPath} = findBlockAndChildFromPath(editor, patch.path)
  if (!block) {
    debug('Block not found')
    return false
  }
  if (!child || !childPath) {
    debug('Child not found')
    return false
  }
  const isSpanTextDiffMatchPatch =
    block &&
    editor.isTextBlock(block) &&
    patch.path.length === 4 &&
    patch.path[1] === 'children' &&
    patch.path[3] === 'text'

  if (!isSpanTextDiffMatchPatch || !Text.isText(child)) {
    return false
  }

  const patches = parsePatch(patch.value)
  const [newValue] = diffMatchPatchApplyPatches(patches, child.text)
  const diff = cleanupEfficiency(makeDiff(child.text, newValue), 5)

  debugState(editor, 'before')
  let offset = 0
  for (const [op, text] of diff) {
    if (op === DIFF_INSERT) {
      editor.apply({type: 'insert_text', path: childPath, offset, text})
      offset += text.length
    } else if (op === DIFF_DELETE) {
      editor.apply({type: 'remove_text', path: childPath, offset: offset, text})
    } else if (op === DIFF_EQUAL) {
      offset += text.length
    }
  }
  debugState(editor, 'after')

  return true
}

function insertPatch(
  editor: PortableTextSlateEditor,
  patch: InsertPatch,
  schemaTypes: PortableTextMemberSchemaTypes
) {
  const {
    block: targetBlock,
    child: targetChild,
    blockPath: targetBlockPath,
    childPath: targetChildPath,
  } = findBlockAndChildFromPath(editor, patch.path)
  if (!targetBlock || !targetBlockPath) {
    debug('Block not found')
    return false
  }
  if (patch.path.length > 1 && patch.path[1] !== 'children') {
    debug('Ignoring patch targeting void value')
    return false
  }
  // Insert blocks
  if (patch.path.length === 1) {
    const {items, position} = patch
    const blocksToInsert = toSlateValue(
      items as PortableTextBlock[],
      {schemaTypes},
      KEY_TO_SLATE_ELEMENT.get(editor)
    ) as Descendant[]
    const targetBlockIndex = targetBlockPath[0]
    const normalizedIdx = position === 'after' ? targetBlockIndex + 1 : targetBlockIndex
    debug(`Inserting blocks at path [${normalizedIdx}]`)
    debugState(editor, 'before')
    Transforms.insertNodes(editor, blocksToInsert, {at: [normalizedIdx]})
    debugState(editor, 'after')
    return true
  }
  // Insert children
  const {items, position} = patch
  if (!targetChild || !targetChildPath) {
    debug('Child not found')
    return false
  }
  const childrenToInsert =
    targetBlock &&
    toSlateValue(
      [{...targetBlock, children: items as PortableTextChild[]}],
      {schemaTypes},
      KEY_TO_SLATE_ELEMENT.get(editor)
    )
  const targetChildIndex = targetChildPath[1]
  const normalizedIdx = position === 'after' ? targetChildIndex + 1 : targetChildIndex
  const childInsertPath = [targetChildPath[0], normalizedIdx]
  debug(`Inserting children at path ${childInsertPath}`)
  debugState(editor, 'before')
  if (childrenToInsert && Element.isElement(childrenToInsert[0])) {
    Transforms.insertNodes(editor, childrenToInsert[0].children, {at: childInsertPath})
  }
  debugState(editor, 'after')
  return true
}

function setPatch(editor: PortableTextSlateEditor, patch: SetPatch) {
  let value = patch.value
  if (typeof patch.path[3] === 'string') {
    value = {}
    value[patch.path[3]] = patch.value
  }
  const {block, blockPath, child, childPath} = findBlockAndChildFromPath(editor, patch.path)

  if (!block) {
    debug('Block not found')
    return false
  }
  const isTextBlock = editor.isTextBlock(block)

  // Ignore patches targeting nested void data, like 'markDefs'
  if (isTextBlock && patch.path.length > 1 && patch.path[1] !== 'children') {
    debug('Ignoring setting void value')
    return false
  }

  debugState(editor, 'before')

  // If this is targeting a text block child
  if (isTextBlock && child && childPath) {
    if (Text.isText(value) && Text.isText(child)) {
      const newText = child.text
      const oldText = value.text
      if (oldText !== newText) {
        debug('Setting text property')
        editor.apply({
          type: 'remove_text',
          path: childPath,
          offset: 0,
          text: newText,
        })
        editor.apply({
          type: 'insert_text',
          path: childPath,
          offset: 0,
          text: value.text,
        })
        // call OnChange here to emit the new selection
        // the user's selection might be interfering with
        editor.onChange()
      }
    } else {
      debug('Setting non-text property')
      editor.apply({
        type: 'set_node',
        path: childPath,
        properties: {},
        newProperties: value as Partial<Node>,
      })
    }
    return true
  } else if (Element.isElement(block) && patch.path.length === 1 && blockPath) {
    debug('Setting block property')
    const {children, ...nextRest} = value as unknown as PortableTextBlock
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {children: prevChildren, ...prevRest} = block || {children: undefined}
    editor.apply({
      type: 'set_node',
      path: blockPath,
      properties: {...prevRest},
      newProperties: nextRest,
    })
    block.children.forEach((c, cIndex) => {
      editor.apply({
        type: 'remove_node',
        path: blockPath.concat(cIndex),
        node: c,
      })
    })
    if (Array.isArray(children)) {
      children.forEach((c, cIndex) => {
        editor.apply({
          type: 'insert_node',
          path: blockPath.concat(cIndex),
          node: c,
        })
      })
    }
  } else if (block && 'value' in block) {
    const newVal = applyAll([block.value], [patch])[0]
    Transforms.setNodes(editor, {...block, value: newVal}, {at: blockPath})
    return true
  }
  debugState(editor, 'after')
  return true
}

function unsetPatch(editor: PortableTextSlateEditor, patch: UnsetPatch, previousPatch?: Patch) {
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
    // call OnChange here to emit the new selection
    editor.onChange()
    debugState(editor, 'after')
    return true
  }
  const {block, blockPath, child, childPath} = findBlockAndChildFromPath(editor, patch.path)
  // Single blocks
  if (patch.path.length === 1) {
    if (!block || !blockPath) {
      debug('Block not found')
      return false
    }
    const blockIndex = blockPath[0]
    debug(`Removing block at path [${blockIndex}]`)
    debugState(editor, 'before')

    Transforms.removeNodes(editor, {at: [blockIndex]})
    debugState(editor, 'after')
    return true
  }

  // Unset on text block children
  if (editor.isTextBlock(block) && patch.path[1] === 'children' && patch.path.length === 3) {
    if (!child || !childPath) {
      debug('Child not found')
      return false
    }
    const childIndex = childPath[1]
    debug(`Unsetting child at path ${JSON.stringify(childPath)}`)
    debugState(editor, 'before')
    if (debugVerbose) {
      debug(`Removing child at path ${JSON.stringify([childPath, childIndex])}`)
    }
    Transforms.removeNodes(editor, {at: childPath})
    debugState(editor, 'after')
    return true
  }
  return false
}

function isKeyedSegment(segment: PathSegment): segment is KeyedSegment {
  return typeof segment === 'object' && '_key' in segment
}

function debugState(
  editor: Pick<PortableTextSlateEditor, 'children' | 'isTextBlock' | 'apply' | 'selection'>,
  stateName: string
) {
  if (!debugVerbose) {
    return
  }

  debug(`Children ${stateName}:`, JSON.stringify(editor.children, null, 2))
  debug(`Selection ${stateName}: `, JSON.stringify(editor.selection, null, 2))
}

function findBlockFromPath(
  editor: Pick<
    PortableTextSlateEditor,
    'children' | 'isTextBlock' | 'apply' | 'selection' | 'onChange'
  >,
  path: Path
): {block?: Descendant; path?: SlatePath} {
  let blockIndex = -1
  const block = editor.children.find((node: Descendant, index: number) => {
    const isMatch = isKeyedSegment(path[0]) ? node._key === path[0]._key : index === path[0]
    if (isMatch) {
      blockIndex = index
    }
    return isMatch
  })
  if (!block) {
    return {}
  }
  return {block, path: [blockIndex] as SlatePath}
}

function findBlockAndChildFromPath(
  editor: Pick<
    PortableTextSlateEditor,
    'children' | 'isTextBlock' | 'apply' | 'selection' | 'onChange'
  >,
  path: Path
): {child?: Descendant; childPath?: SlatePath; block?: Descendant; blockPath?: SlatePath} {
  const {block, path: blockPath} = findBlockFromPath(editor, path)
  if (!(Element.isElement(block) && path[1] === 'children')) {
    return {block, blockPath, child: undefined, childPath: undefined}
  }
  let childIndex = -1
  const child = block.children.find((node, index: number) => {
    const isMatch = isKeyedSegment(path[2]) ? node._key === path[2]._key : index === path[2]
    if (isMatch) {
      childIndex = index
    }
    return isMatch
  })
  if (!child) {
    return {block, blockPath, child: undefined, childPath: undefined}
  }
  return {block, child, blockPath, childPath: blockPath?.concat(childIndex) as SlatePath}
}
