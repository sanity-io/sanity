import {Element, Operation, InsertNodeOperation, Text as SlateText} from 'slate'
import {PortableTextFeatures, TextBlock, ListItem, TextSpan} from '../../types/portableText'
import {debugWithName} from '../../utils/debug'
import {PortableTextSlateEditor} from '../../types/editor'

const debug = debugWithName('plugin:withSchemaTypes')
/**
 * This plugin makes sure that shema types are recognized properly by Slate as blocks, voids, inlines
 *
 */
export function createWithSchemaTypes(portableTextFeatures: PortableTextFeatures) {
  return function withSchemaTypes(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    editor.isTextBlock = (value: any): value is TextBlock => {
      return (
        !editor.isVoid(value) &&
        'markDefs' in value &&
        'style' in value &&
        'children' in value &&
        '_type' in value &&
        portableTextFeatures.types.block.name === value._type
      )
    }
    editor.isTextSpan = (value: any): value is TextSpan => {
      return (
        !editor.isVoid(value) &&
        'text' in value &&
        'marks' in value &&
        '_type' in value &&
        portableTextFeatures.types.span.name === value._type
      )
    }
    editor.isListBlock = (value: any): value is ListItem => {
      return Boolean(
        editor.isTextBlock(value) &&
          'listItem' in value &&
          'level' in value &&
          value.listItem &&
          Number.isInteger(value.level)
      )
    }
    editor.isVoid = (element: Element): boolean => {
      return (
        portableTextFeatures.types.block.name !== element._type &&
        (portableTextFeatures.types.blockObjects.map((obj) => obj.name).includes(element._type) ||
          portableTextFeatures.types.inlineObjects.map((obj) => obj.name).includes(element._type))
      )
    }
    editor.isInline = (element: Element): boolean => {
      const inlineSchemaTypes = portableTextFeatures.types.inlineObjects.map((obj) => obj.name)
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
