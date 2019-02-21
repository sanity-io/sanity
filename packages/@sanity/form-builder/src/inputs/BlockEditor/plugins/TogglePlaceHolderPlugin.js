// @flow

// This plugin toggles data prop 'placeholder' on a contenBlock
// The block is considered a placeholder if it is the single one
// in the document and and empty. A unset patch for the field will be
// sent by createOperationToPatches if the placeholder block is the
// only thing left in the document

import type {SlateEditor} from '../typeDefs'

export default function TogglePlaceHolderAttributePlugin() {
  return {
    onKeyUp(event: any, editor: SlateEditor, next: void => void) {
      if (editor.value.document.nodes.size === 1) {
        const block = editor.value.document.nodes.first()
        if (
          block.type === 'contentBlock' &&
          block.nodes.every(node => node.object === 'text') &&
          block.text === ''
        ) {
          const newData = block.data.toObject()
          newData.placeholder = true
          editor.setNodeByKey(block.key, {data: newData})
        } else if (block.type === 'contentBlock' && block.data.get('placeholder')) {
          const newData = block.data.toObject()
          delete newData.placeholder
          editor.setNodeByKey(block.key, {data: newData})
        }
      }
      return next()
    }
  }
}
