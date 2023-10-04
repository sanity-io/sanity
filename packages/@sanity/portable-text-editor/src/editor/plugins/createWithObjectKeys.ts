import {Transforms, Node, Editor, Element, Text} from 'slate'
import {PortableTextMemberSchemaTypes, PortableTextSlateEditor} from '../../types/editor'
import {isPreservingKeys, PRESERVE_KEYS} from '../../utils/withPreserveKeys'
import {debugWithName} from '../../utils/debug'

const debug = debugWithName('plugin:withObjectKeys')

/**
 * This plugin makes sure that every new node in the editor get a new _key prop when created
 *
 */
export function createWithObjectKeys(
  schemaTypes: PortableTextMemberSchemaTypes,
  keyGenerator: () => string,
) {
  return function withKeys(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    PRESERVE_KEYS.set(editor, false)
    const {apply, normalizeNode} = editor
    editor.apply = (operation) => {
      if (operation.type === 'split_node') {
        operation.properties = {
          ...operation.properties,
          _key: keyGenerator(),
        }
      }
      if (operation.type === 'insert_node') {
        // Must be given a new key or adding/removing marks while typing gets in trouble (duped keys)!
        const withNewKey = !isPreservingKeys(editor) || !('_key' in operation.node)
        if (!Editor.isEditor(operation.node)) {
          operation.node = {
            ...operation.node,
            ...(withNewKey ? {_key: keyGenerator()} : {}),
          }
        }
      }
      apply(operation)
    }
    editor.normalizeNode = (entry) => {
      const [node, path] = entry
      // If the node is a block, ensure everything got keys
      if (path.length === 1) {
        // Set key on block itself
        if (!node._key) {
          debug('Assigning _key to block')
          Transforms.setNodes(editor, {_key: keyGenerator()}, {at: path})
        }
        // Set keys on it's children for text blocks
        for (const [child, childPath] of Node.children(editor, path)) {
          if (!child._key) {
            debug('Assigning _key to block child')
            Transforms.setNodes(editor, {_key: keyGenerator()}, {at: childPath})
            return
          }
        }
      }
      // If the node is a child, ensure key
      if (path.length === 2 && node._key === undefined) {
        debug('Assigning _key to child node', node)
        Transforms.setNodes(editor, {_key: keyGenerator()}, {at: path})
      }
      normalizeNode(entry)
    }

    return editor
  }
}
