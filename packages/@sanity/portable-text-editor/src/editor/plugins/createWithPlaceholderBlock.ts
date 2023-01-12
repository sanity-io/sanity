import {Transforms, Descendant} from 'slate'
import {PortableTextSlateEditor} from '../../types/editor'
import {PortableTextFeatures} from '../../types/portableText'
import {debugWithName} from '../../utils/debug'
import {withoutPatching} from '../../utils/withoutPatching'
import {withoutSaving} from './createWithUndoRedo'

const debug = debugWithName('plugin:withPlaceholderBlock')

interface Options {
  portableTextFeatures: PortableTextFeatures
  keyGenerator: () => string
}
/**
 * Keep a "placeholder" block present when the editor is empty
 *
 */
export function createWithPlaceholderBlock({
  portableTextFeatures,
  keyGenerator,
}: Options): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  return function withPlaceholderBlock(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    editor.createPlaceholderBlock = (): Descendant => {
      return {
        _type: portableTextFeatures.types.block.name,
        _key: keyGenerator(),
        style: portableTextFeatures.styles[0].value,
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: keyGenerator(),
            text: '',
            marks: [],
          },
        ],
      }
    }
    const {onChange} = editor
    // Make sure there's a placeholder block present if the editor's children become empty
    editor.onChange = () => {
      const hadSelection = !!editor.selection
      onChange()
      if (editor.children.length === 0) {
        debug('Inserting placeholder block')
        Transforms.deselect(editor)
        // Set the value directly without using transforms as we don't want this to be producing any patches
        editor.children = [editor.createPlaceholderBlock()]
        if (hadSelection) {
          Transforms.select(editor, {
            focus: {path: [0, 0], offset: 0},
            anchor: {path: [0, 0], offset: 0},
          })
        }
        editor.onChange()
      }
    }
    return editor
  }
}
