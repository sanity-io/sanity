import {type EditorSelection, PortableTextEditor} from '@portabletext/editor'
import {CalendarIcon} from '@sanity/icons'
import {isPortableTextSpan} from '@sanity/types'
import {randomKey} from '@sanity/util/content'
import {type ComponentType, useCallback, useMemo, useState} from 'react'

import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'

export interface SlashCommand {
  key: string
  label: string
  icon: ComponentType
}

interface UseSlashCommandsOptions {
  editor: PortableTextEditor
  disabled?: boolean
}

interface UseSlashCommandsReturn {
  menuOpen: boolean
  searchTerm: string
  commands: SlashCommand[]
  closeMenu: () => void
  onBeforeInput: (event: InputEvent) => void
  executeCommand: (command: SlashCommand) => void
}

export function useSlashCommands(options: UseSlashCommandsOptions): UseSlashCommandsReturn {
  const {editor, disabled} = options
  const {t} = useTranslation(releasesLocaleNamespace)

  const [menuOpen, setMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectionAtSlashInsert, setSelectionAtSlashInsert] = useState<EditorSelection>(null)

  const commands: SlashCommand[] = useMemo(
    () => [{key: 'link-release', label: t('description.link-release'), icon: CalendarIcon}],
    [t],
  )

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setSearchTerm('')
    setSelectionAtSlashInsert(null)
  }, [])

  const openMenu = useCallback(() => {
    if (disabled) return
    setMenuOpen(true)
    setSearchTerm('')
    setSelectionAtSlashInsert(PortableTextEditor.getSelection(editor))
  }, [editor, disabled])

  const onBeforeInput = useCallback(
    (event: InputEvent): void => {
      if (disabled) return

      const selection = PortableTextEditor.getSelection(editor)
      const cursorOffset = selection ? selection.focus.offset : 0
      const focusChild = PortableTextEditor.focusChild(editor)
      const focusSpan = isPortableTextSpan(focusChild) ? focusChild : undefined

      const isInsertText = event.inputType === 'insertText'
      const isDeleteText = event.inputType === 'deleteContentBackward'
      const isInsertingSlash = isInsertText && event.data === '/'

      const isWhitespaceCharBeforeCursorPosition =
        focusSpan?.text.slice(cursorOffset - 1, cursorOffset) === ' '

      // Open the slash menu when `/` is typed at start of text or after whitespace
      if (isInsertingSlash && (cursorOffset < 1 || isWhitespaceCharBeforeCursorPosition)) {
        openMenu()
        return
      }

      if (!menuOpen) return

      // Typing a space immediately after `/` dismisses the menu
      const filterStartsWithSpaceChar = isInsertText && event.data === ' ' && !searchTerm
      if (filterStartsWithSpaceChar) {
        closeMenu()
        return
      }

      const lastIndexOfSlash =
        focusSpan?.text.slice(0, Math.max(0, cursorOffset)).lastIndexOf('/') ?? 0

      // Handle delete: if deleting would remove the `/` itself, close the menu
      if (isDeleteText) {
        if (
          focusSpan?.text.length === 1 ||
          lastIndexOfSlash === (focusSpan?.text.length ?? 0) - 1
        ) {
          closeMenu()
          return
        }
      }

      // Update the search term
      if (isPortableTextSpan(focusChild)) {
        let term = focusChild.text.slice(lastIndexOfSlash + 1, cursorOffset)

        if (isInsertText) {
          term += event.data
        }

        if (isDeleteText) {
          term = term.slice(0, Math.max(0, term.length - 1))
        }

        const hasMatches = commands.some((cmd) =>
          cmd.label.toLowerCase().includes(term.toLowerCase()),
        )

        if (!hasMatches) {
          closeMenu()
          return
        }

        setSearchTerm(term)
      }
    },
    [closeMenu, editor, searchTerm, openMenu, disabled, commands, menuOpen],
  )

  const executeCommand = useCallback(
    (command: SlashCommand) => {
      const [span, spanPath] =
        (selectionAtSlashInsert &&
          PortableTextEditor.findByPath(editor, selectionAtSlashInsert.focus.path)) ||
        []

      if (span && isPortableTextSpan(span) && spanPath) {
        PortableTextEditor.focus(editor)
        const offset = PortableTextEditor.getSelection(editor)?.focus.offset

        if (typeof offset !== 'undefined') {
          // Delete the `/query` text
          PortableTextEditor.delete(
            editor,
            {
              anchor: {path: spanPath, offset: span.text.lastIndexOf('/')},
              focus: {path: spanPath, offset},
            },
            {mode: 'selected'},
          )

          if (command.key === 'link-release') {
            const schemaType = editor.schemaTypes.inlineObjects.find(
              (inlineType) => inlineType.name === 'releaseReference',
            )
            if (schemaType) {
              PortableTextEditor.insertChild(editor, schemaType, {
                _type: 'releaseReference',
                _key: randomKey(12),
                releaseId: '',
              })
            }
          }
        }
      }

      closeMenu()
      PortableTextEditor.focus(editor)
    },
    [editor, selectionAtSlashInsert, closeMenu],
  )

  return {
    menuOpen,
    searchTerm,
    commands,
    closeMenu,
    onBeforeInput,
    executeCommand,
  }
}
