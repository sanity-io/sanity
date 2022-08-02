/* eslint-disable max-statements */
/* eslint-disable complexity */
import {Editor, Transforms, Path, Range} from 'slate'
import isHotkey from 'is-hotkey'
import {ReactEditor} from '@sanity/slate-react'
import {PortableTextFeatures} from '../../types/portableText'
import {PortableTextSlateEditor} from '../../types/editor'
import {HotkeyOptions} from '../../types/options'
import {debugWithName} from '../../utils/debug'
import {toSlateValue} from '../../utils/values'
import {PortableTextEditor} from '../PortableTextEditor'

const debug = debugWithName('plugin:withHotKeys')

const DEFAULT_HOTKEYS: HotkeyOptions = {
  marks: {
    'mod+b': 'strong',
    'mod+i': 'em',
    'mod+u': 'underline',
    "mod+'": 'code',
  },
  custom: {},
}

/**
 * This plugin takes care of all hotkeys in the editor
 *
 */
export function createWithHotkeys(
  portableTextFeatures: PortableTextFeatures,
  keyGenerator: () => string,
  portableTextEditor: PortableTextEditor,
  hotkeysFromOptions?: HotkeyOptions
): (editor: PortableTextSlateEditor & ReactEditor) => any {
  const reservedHotkeys = ['enter', 'tab', 'shift', 'delete', 'end']
  const activeHotkeys = hotkeysFromOptions || DEFAULT_HOTKEYS // TODO: Merge where possible? A union?
  const createEmptyBlock = () =>
    toSlateValue(
      [
        {
          _type: portableTextFeatures.types.block.name,
          _key: keyGenerator(),
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: keyGenerator(),
              text: '',
              marks: [],
            },
          ],
        },
      ],
      portableTextEditor
    )[0]
  return function withHotKeys(editor: PortableTextSlateEditor & ReactEditor) {
    editor.pteWithHotKeys = (event: React.KeyboardEvent<HTMLDivElement>): void => {
      // Wire up custom marks hotkeys
      Object.keys(activeHotkeys).forEach((cat) => {
        if (cat === 'marks') {
          // eslint-disable-next-line guard-for-in
          for (const hotkey in activeHotkeys[cat]) {
            if (reservedHotkeys.includes(hotkey)) {
              throw new Error(`The hotkey ${hotkey} is reserved!`)
            }
            if (isHotkey(hotkey, event.nativeEvent)) {
              event.preventDefault()
              const possibleMark = activeHotkeys[cat]
              if (possibleMark) {
                const mark = possibleMark[hotkey]
                debug(`HotKey ${hotkey} to toggle ${mark}`)
                editor.pteToggleMark(mark)
              }
            }
          }
        }
        if (cat === 'custom') {
          // eslint-disable-next-line guard-for-in
          for (const hotkey in activeHotkeys[cat]) {
            if (reservedHotkeys.includes(hotkey)) {
              throw new Error(`The hotkey ${hotkey} is reserved!`)
            }
            if (isHotkey(hotkey, event.nativeEvent)) {
              const possibleCommand = activeHotkeys[cat]
              if (possibleCommand) {
                const command = possibleCommand[hotkey]
                command(event, portableTextEditor)
              }
            }
          }
        }
      })

      const isEnter = isHotkey('enter', event.nativeEvent)
      const isTab = isHotkey('tab', event.nativeEvent)
      const isShiftEnter = isHotkey('shift+enter', event.nativeEvent)
      const isShiftTab = isHotkey('shift+tab', event.nativeEvent)
      const isBackspace = isHotkey('backspace', event.nativeEvent)
      const isDelete = isHotkey('delete', event.nativeEvent)

      // Disallow deleting void blocks by backspace from another line.
      // Otherwise it's so easy to delete the void block above when trying to delete text on
      // the line below or above
      if (
        isBackspace &&
        editor.selection &&
        editor.selection.focus.path[0] > 0 &&
        Range.isCollapsed(editor.selection)
      ) {
        const [prevBlock, prevPath] = Editor.node(
          editor,
          Path.previous(editor.selection.focus.path.slice(0, 1))
        )
        const [focusBlock] = Editor.node(editor, editor.selection.focus, {depth: 1})
        if (
          prevBlock &&
          focusBlock &&
          Editor.isVoid(editor, prevBlock) &&
          editor.selection.focus.offset === 0
        ) {
          debug('Preventing deleting void block above')
          event.preventDefault()
          event.stopPropagation()
          Transforms.removeNodes(editor, {match: (n) => n === focusBlock})
          Transforms.select(editor, prevPath)
          editor.onChange()
          return
        }
      }
      if (
        isDelete &&
        editor.selection &&
        editor.selection.focus.offset === 0 &&
        Range.isCollapsed(editor.selection) &&
        editor.children[editor.selection.focus.path[0] + 1]
      ) {
        const [nextBlock] = Editor.node(editor, Path.next(editor.selection.focus.path.slice(0, 1)))
        const [focusBlock, focusBlockPath] = Editor.node(editor, editor.selection.focus, {depth: 1})
        if (
          nextBlock &&
          focusBlock &&
          !Editor.isVoid(editor, focusBlock) &&
          Editor.isVoid(editor, nextBlock)
        ) {
          debug('Preventing deleting void block below')
          event.preventDefault()
          event.stopPropagation()
          Transforms.removeNodes(editor, {match: (n) => n === focusBlock})
          Transforms.select(editor, focusBlockPath)
          editor.onChange()
          return
        }
      }

      // Tab for lists
      if (isTab || isShiftTab) {
        if (editor.pteIncrementBlockLevels(isShiftTab)) {
          event.preventDefault()
        }
      }

      // Deal with enter key combos
      if (isEnter && !isShiftEnter && editor.selection) {
        let focusBlock
        try {
          ;[focusBlock] = Editor.node(editor, editor.selection.focus, {depth: 1})
        } catch (err) {
          // Just ignore
        }
        // List item enter key
        if (editor.isListBlock(focusBlock)) {
          if (editor.pteEndList()) {
            event.preventDefault()
          }
          return
        }

        // Enter from another style than the first (default one)
        if (
          editor.isTextBlock(focusBlock) &&
          focusBlock.style &&
          focusBlock.style !== portableTextFeatures.styles[0].value
        ) {
          const [, end] = Range.edges(editor.selection)
          const endAtEndOfNode = Editor.isEnd(editor, end, end.path)
          if (endAtEndOfNode) {
            Editor.insertNode(editor, createEmptyBlock())
            event.preventDefault()
            return
          }
        }
        // Block object enter key
        if (focusBlock && Editor.isVoid(editor, focusBlock)) {
          Editor.insertNode(editor, createEmptyBlock())
          event.preventDefault()
          return
        }
      }

      // Soft line breaks
      if (isShiftEnter) {
        event.preventDefault()
        editor.insertText('\n')
        return
      }

      // Undo/redo
      if (isHotkey('mod+z', event.nativeEvent)) {
        event.preventDefault()
        editor.undo()
        return
      }
      if (isHotkey('mod+y', event.nativeEvent) || isHotkey('mod+shift+z', event.nativeEvent)) {
        event.preventDefault()
        editor.redo()
      }
    }
    return editor
  }
}
