import {Element, Operation, InsertNodeOperation, Text as SlateText} from 'slate'
import {
  isPortableTextTextBlock,
  PortableTextTextBlock,
  isPortableTextSpan,
  PortableTextSpan,
  PortableTextListBlock,
  isPortableTextListBlock,
} from '@sanity/types'
import {debugWithName} from '../../utils/debug'
import {PortableTextMemberSchemaTypes, PortableTextSlateEditor} from '../../types/editor'

const debug = debugWithName('plugin:withSchemaTypes')
/**
 * This plugin makes sure that schema types are recognized properly by Slate as blocks, voids, inlines
 *
 */
export function createWithSchemaTypes(types: PortableTextMemberSchemaTypes) {
  return function withSchemaTypes(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    editor.isTextBlock = (value: unknown): value is PortableTextTextBlock => {
      return isPortableTextTextBlock(value) && value._type === types.block.name
    }
    editor.isTextSpan = (value: unknown): value is PortableTextSpan => {
      return isPortableTextSpan(value) && value._type == types.span.name
    }
    editor.isListBlock = (value: unknown): value is PortableTextListBlock => {
      return isPortableTextListBlock(value) && value._type === types.block.name
    }
    editor.isVoid = (element: Element): boolean => {
      return (
        types.block.name !== element._type &&
        (types.blockObjects.map((obj) => obj.name).includes(element._type) ||
          types.inlineObjects.map((obj) => obj.name).includes(element._type))
      )
    }
    editor.isInline = (element: Element): boolean => {
      const inlineSchemaTypes = types.inlineObjects.map((obj) => obj.name)
      return (
        inlineSchemaTypes.includes(element._type) &&
        '__inline' in element &&
        element.__inline === true
      )
    }
    // Extend Slate's default normalization to add _type span to span inserted after a inline void object
    const {apply} = editor
    editor.apply = (op: Operation) => {
      const isInsertTextWithoutType =
        op.type === 'insert_node' &&
        op.path.length === 2 &&
        SlateText.isText(op.node) &&
        op.node._type === undefined
      if (isInsertTextWithoutType) {
        const insertNodeOperation = op as InsertNodeOperation
        const newNode: SlateText = {
          ...(insertNodeOperation.node as SlateText),
          _type: 'span',
        }
        op.node = newNode
        debug('Setting span type to child without a type', op)
      }
      apply(op)
    }
    return editor
  }
}
