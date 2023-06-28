/* eslint-disable max-statements */
/* eslint-disable complexity */
import {Editor, Transforms, Path, Range, Node} from 'slate'
import isHotkey from 'is-hotkey'
import {ReactEditor} from 'slate-react'
import {isPortableTextSpan, isPortableTextTextBlock} from '@sanity/types'
import {PortableTextMemberSchemaTypes, PortableTextSlateEditor} from '../../types/editor'
import {HotkeyOptions} from '../../types/options'
import {debugWithName} from '../../utils/debug'
import {toSlateValue} from '../../utils/values'
import {PortableTextEditor} from '../PortableTextEditor'
import {SlateTextBlock, VoidElement} from '../../types/slate'

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
  types: PortableTextMemberSchemaTypes,
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
          _type: types.block.name,
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
        const prevPath = Path.previous(editor.selection.focus.path.slice(0, 1))
        const prevBlock = Node.descendant(editor, prevPath) as SlateTextBlock | VoidElement
        const focusBlock = Node.descendant(editor, editor.selection.focus.path.slice(0, 1))
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
        const nextBlock = Node.descendant(
          editor,
          Path.next(editor.selection.focus.path.slice(0, 1))
        ) as SlateTextBlock | VoidElement
        const focusBlockPath = editor.selection.focus.path.slice(0, 1)
        const focusBlock = Node.descendant(editor, focusBlockPath) as SlateTextBlock | VoidElement

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
      // Only steal tab when we are on a plain text span or we are at the start of the line (fallback if the whole block is annotated or contains a single inline object)
      // Otherwise tab is reserved for accessability for buttons etc.
      if ((isTab || isShiftTab) && editor.selection) {
        const [focusChild] = Editor.node(editor, editor.selection.focus, {depth: 2})
        const [focusBlock] = isPortableTextSpan(focusChild)
          ? Editor.node(editor, editor.selection.focus, {depth: 1})
          : []
        const hasAnnotationFocus =
          focusChild &&
          isPortableTextTextBlock(focusBlock) &&
          isPortableTextSpan(focusChild) &&
          (focusChild.marks || ([] as string[])).filter((m) =>
            (focusBlock.markDefs || []).map((def) => def._key).includes(m)
          ).length > 0
        const [start] = Range.edges(editor.selection)
        const atStartOfNode = Editor.isStart(editor, start, start.path)

        if (
          focusChild &&
          isPortableTextSpan(focusChild) &&
          (!hasAnnotationFocus || atStartOfNode) &&
          editor.pteIncrementBlockLevels(isShiftTab)
        ) {
          event.preventDefault()
        }
      }

      // Deal with enter key combos
      if (isEnter && !isShiftEnter && editor.selection) {
        const focusBlockPath = editor.selection.focus.path.slice(0, 1)
        const focusBlock = Node.descendant(editor, focusBlockPath) as SlateTextBlock | VoidElement

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
          focusBlock.style !== types.styles[0].value
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
        event.preventDefault()
        editor.insertBreak()
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
