import {
  isPortableTextListBlock,
  isPortableTextSpan,
  isPortableTextTextBlock,
  type PortableTextListBlock,
  type PortableTextSpan,
  type PortableTextTextBlock,
} from '@sanity/types'
import {type Element, Transforms} from 'slate'

import {type PortableTextMemberSchemaTypes, type PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'

const debug = debugWithName('plugin:withSchemaTypes')
/**
 * This plugin makes sure that schema types are recognized properly by Slate as blocks, voids, inlines
 *
 */
export function createWithSchemaTypes({
  schemaTypes,
  keyGenerator,
}: {
  schemaTypes: PortableTextMemberSchemaTypes
  keyGenerator: () => string
}) {
  return function withSchemaTypes(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    editor.isTextBlock = (value: unknown): value is PortableTextTextBlock => {
      return isPortableTextTextBlock(value) && value._type === schemaTypes.block.name
    }
    editor.isTextSpan = (value: unknown): value is PortableTextSpan => {
      return isPortableTextSpan(value) && value._type == schemaTypes.span.name
    }
    editor.isListBlock = (value: unknown): value is PortableTextListBlock => {
      return isPortableTextListBlock(value) && value._type === schemaTypes.block.name
    }
    editor.isVoid = (element: Element): boolean => {
      return (
        schemaTypes.block.name !== element._type &&
        (schemaTypes.blockObjects.map((obj) => obj.name).includes(element._type) ||
          schemaTypes.inlineObjects.map((obj) => obj.name).includes(element._type))
      )
    }
    editor.isInline = (element: Element): boolean => {
      const inlineSchemaTypes = schemaTypes.inlineObjects.map((obj) => obj.name)
      return (
        inlineSchemaTypes.includes(element._type) &&
        '__inline' in element &&
        element.__inline === true
      )
    }

    // Extend Slate's default normalization
    const {normalizeNode} = editor
    editor.normalizeNode = (entry) => {
      const [node, path] = entry

      // If text block children node is missing _type, set it to the span type
      if (node._type === undefined && path.length === 2) {
        debug('Setting span type on text node without a type')
        const span = node as PortableTextSpan
        const key = span._key || keyGenerator()
        Transforms.setNodes(editor, {...span, _type: schemaTypes.span.name, _key: key}, {at: path})
      }

      // catches cases when the children are missing keys but excludes it when the normalize is running the node as the editor object
      if (node._key === undefined && (path.length === 1 || path.length === 2)) {
        debug('Setting missing key on child node without a key')
        const key = keyGenerator()
        Transforms.setNodes(editor, {_key: key}, {at: path})
      }

      normalizeNode(entry)
    }
    return editor
  }
}
