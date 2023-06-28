import {Element, Transforms, Node, Editor} from 'slate'
import {PortableTextMemberSchemaTypes, PortableTextSlateEditor} from '../../types/editor'
import {isPreservingKeys, PRESERVE_KEYS} from '../../utils/withPreserveKeys'

/**
 * This plugin makes sure that every new node in the editor get a new _key prop when created
 *
 */
export function createWithObjectKeys(
  schemaTypes: PortableTextMemberSchemaTypes,
  keyGenerator: () => string
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
      if (Element.isElement(node) && node._type === schemaTypes.block.name) {
        // Set key on block itself
        if (!node._key) {
          Transforms.setNodes(editor, {_key: keyGenerator()}, {at: path})
        }
        // Set keys on it's children
        for (const [child, childPath] of Node.children(editor, path)) {
          if (!child._key) {
            Transforms.setNodes(editor, {_key: keyGenerator()}, {at: childPath})
            return
          }
        }
      }
      normalizeNode(entry)
    }

    return editor
  }
}
