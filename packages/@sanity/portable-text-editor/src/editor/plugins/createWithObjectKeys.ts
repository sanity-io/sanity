import {Element, Transforms, Node, Editor} from 'slate'
import {PortableTextFeatures} from '../../types/portableText'
import {PortableTextSlateEditor} from '../../types/editor'

/**
 * This plugin makes sure that every new node in the editor get a new _key prop when created
 *
 */
export function createWithObjectKeys(
  portableTextFeatures: PortableTextFeatures,
  keyGenerator: () => string
) {
  return function withKeys(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    const {apply, normalizeNode} = editor
    editor.apply = (operation) => {
      if (operation.type === 'split_node') {
        operation.properties = {...operation.properties, _key: keyGenerator()}
      }
      if (operation.type === 'insert_node') {
        // Must be given a new key or adding/removing marks while typing gets in trouble (duped keys)!
        if (!Editor.isEditor(operation.node)) {
          operation.node = {...operation.node, _key: keyGenerator()}
        }
      }
      apply(operation)
    }
    editor.normalizeNode = (entry) => {
      const [node, path] = entry
      if (Element.isElement(node) && node._type === portableTextFeatures.types.block.name) {
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
      // Do the original `normalizeNode` to enforce other constraints.
      normalizeNode(entry)
    }

    return editor
  }
}
