import {Editor, Range, Transforms, Text, Descendant} from 'slate'
import {PortableTextSlateEditor} from '../../types/editor'
import {PortableTextFeatures} from '../../types/portableText'
import {debugWithName} from '../../utils/debug'

const debug = debugWithName('plugin:withUtils')

interface Options {
  portableTextFeatures: PortableTextFeatures
  keyGenerator: () => string
}
/**
 * This plugin makes various util commands available in the editor
 *
 */
export function createWithUtils({portableTextFeatures, keyGenerator}: Options) {
  return function withUtils(editor: PortableTextSlateEditor): PortableTextSlateEditor {
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
    // Expands the the selection to wrap around the word the focus is at
    editor.pteExpandToWord = () => {
      const {selection} = editor
      if (selection && !Range.isExpanded(selection)) {
        const [textNode] = Editor.node(editor, selection.focus, {depth: 2})
        if (!textNode || !Text.isText(textNode) || textNode.text.length === 0) {
          debug(`pteExpandToWord: Can't expand to word here`)
          return
        }
        const {focus} = selection
        const focusOffset = focus.offset
        const charsBefore = textNode.text.slice(0, focusOffset)
        const charsAfter = textNode.text.slice(focusOffset, -1)
        const isEmpty = (str: string) => str.match(/\s/g)
        const whiteSpaceBeforeIndex = charsBefore
          .split('')
          .reverse()
          .findIndex((str) => isEmpty(str))
        const newStartOffset =
          whiteSpaceBeforeIndex > -1 ? charsBefore.length - whiteSpaceBeforeIndex : 0
        const whiteSpaceAfterIndex = charsAfter.split('').findIndex((obj) => isEmpty(obj))
        const newEndOffset =
          charsBefore.length +
          (whiteSpaceAfterIndex > -1 ? whiteSpaceAfterIndex : charsAfter.length + 1)
        if (!(newStartOffset === newEndOffset || isNaN(newStartOffset) || isNaN(newEndOffset))) {
          debug('pteExpandToWord: Expanding to focused word')
          Transforms.setSelection(editor, {
            anchor: {...selection.anchor, offset: newStartOffset},
            focus: {...selection.focus, offset: newEndOffset},
          })
          return
        }
        debug(`pteExpandToWord: Can't expand to word here`)
      }
    }
    return editor
  }
}
