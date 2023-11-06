import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo, useState} from 'react'
import {Path, isPortableTextSpan} from '@sanity/types'
import {CommentMessage, MentionOptionsHookValue} from '../../../types'
import {hasCommentMessageValue, useCommentHasChanged} from '../../../helpers'
import {useDidUpdate} from 'sanity'

export interface CommentInputContextValue {
  canSubmit?: boolean
  closeMentions: () => void
  editor: PortableTextEditor
  expandOnFocus?: boolean
  focused: boolean
  focusEditor: () => void
  focusOnMount?: boolean
  hasChanges: boolean
  insertAtChar: () => void
  insertMention: (userId: string) => void
  mentionOptions: MentionOptionsHookValue
  mentionsMenuOpen: boolean
  mentionsSearchTerm: string
  onBeforeInput: (event: InputEvent) => void
  openMentions: () => void
  readOnly: boolean
  value: CommentMessage
}

export const CommentInputContext = React.createContext<CommentInputContextValue | null>(null)

interface CommentInputProviderProps {
  children: React.ReactNode
  expandOnFocus?: boolean
  focused: boolean
  focusOnMount?: boolean
  mentionOptions: MentionOptionsHookValue
  onMentionMenuOpenChange?: (open: boolean) => void
  readOnly?: boolean
  value: CommentMessage
}

export function CommentInputProvider(props: CommentInputProviderProps) {
  const {
    children,
    expandOnFocus = false,
    focused,
    focusOnMount = false,
    mentionOptions,
    onMentionMenuOpenChange,
    value,
    readOnly,
  } = props

  const editor = usePortableTextEditor()

  const [mentionsMenuOpen, setMentionsMenuOpen] = useState<boolean>(false)
  const [mentionsSearchTerm, setMentionsSearchTerm] = useState<string>('')
  const [selectionAtMentionInsert, setSelectionAtMentionInsert] = useState<EditorSelection>(null)

  const canSubmit = useMemo(() => hasCommentMessageValue(value), [value])

  const hasChanges = useCommentHasChanged(value)

  const focusEditor = useCallback(() => {
    if (readOnly) return
    PortableTextEditor.focus(editor)
  }, [editor, readOnly])

  const closeMentions = useCallback(() => {
    setMentionsMenuOpen(false)
    setMentionsSearchTerm('')
    setSelectionAtMentionInsert(null)
  }, [])

  const openMentions = useCallback(() => {
    setMentionsMenuOpen(true)
    setMentionsSearchTerm('')
    setMentionsMenuOpen(true)
    setSelectionAtMentionInsert(PortableTextEditor.getSelection(editor))
  }, [editor])

  // This function activates or deactivates the mentions menu and updates
  // the mention search term when the user types into the Portable Text Editor.
  const onBeforeInput = useCallback(
    (event: InputEvent): void => {
      const selection = PortableTextEditor.getSelection(editor)
      const cursorOffset = selection ? selection.focus.offset : 0
      const focusChild = PortableTextEditor.focusChild(editor)
      const focusSpan = (isPortableTextSpan(focusChild) && focusChild) || undefined

      const isInsertText = event.inputType === 'insertText'
      const isDeleteText = event.inputType === 'deleteContentBackward'
      const isInsertingAtChar = isInsertText && event.data === '@'

      const lastIndexOfAt = focusSpan?.text.substring(0, cursorOffset).lastIndexOf('@') || 0

      const isWhitespaceCharBeforeCursorPosition =
        focusSpan?.text.substring(cursorOffset - 1, cursorOffset) === ' '

      const filterStartsWithSpaceChar = isInsertText && event.data === ' ' && !mentionsSearchTerm

      // If we are inserting a '@' character - open the mentions menu and reset the search term.
      // Only do this if it is in the start of the text, or if '@' is inserted when following a whitespace char.
      if (isInsertingAtChar && (cursorOffset < 1 || isWhitespaceCharBeforeCursorPosition)) {
        openMentions()
        return
      }

      // If the user begins typing their filter with a space, or if they are deleting
      // characters after activation and the '@' is no longer there,
      // clear the search term and close the mentions menu.
      if (
        filterStartsWithSpaceChar ||
        (isDeleteText &&
          (focusSpan?.text.length === 1 || lastIndexOfAt === (focusSpan?.text.length || 0) - 1))
      ) {
        closeMentions()
        return
      }

      // Update the search term
      if (isPortableTextSpan(focusChild)) {
        // Term starts with the @ char in the value until the cursor offset
        let term = focusChild.text.substring(lastIndexOfAt + 1, cursorOffset)
        // Add the char to the mentions search term
        if (isInsertText) {
          term += event.data
        }
        // Exclude the char from the mentions search term
        if (isDeleteText) {
          term = term.substring(0, term.length - 1)
        }
        // Set the updated mentions search term
        setMentionsSearchTerm(term)
      }
    },
    [closeMentions, editor, mentionsSearchTerm, openMentions],
  )

  const insertAtChar = useCallback(() => {
    setMentionsMenuOpen(true)
    PortableTextEditor.focus(editor)
    PortableTextEditor.insertChild(editor, editor.schemaTypes.span, {text: '@'})
    setSelectionAtMentionInsert(PortableTextEditor.getSelection(editor))
  }, [editor])

  useDidUpdate(mentionsMenuOpen, () => onMentionMenuOpenChange?.(mentionsMenuOpen))

  const insertMention = useCallback(
    (userId: string) => {
      const mentionSchemaType = editor.schemaTypes.inlineObjects.find((t) => t.name === 'mention')
      let mentionPath: Path | undefined

      const [span, spanPath] =
        (selectionAtMentionInsert &&
          PortableTextEditor.findByPath(editor, selectionAtMentionInsert.focus.path)) ||
        []
      if (span && isPortableTextSpan(span) && spanPath && mentionSchemaType) {
        PortableTextEditor.focus(editor)
        const offset = PortableTextEditor.getSelection(editor)?.focus.offset
        if (typeof offset !== 'undefined') {
          PortableTextEditor.delete(
            editor,
            {
              anchor: {path: spanPath, offset: span.text.lastIndexOf('@')},
              focus: {path: spanPath, offset},
            },
            {mode: 'selected'},
          )
          PortableTextEditor.insertChild(editor, mentionSchemaType, {
            userId: userId,
          })
          PortableTextEditor.insertChild(editor, editor.schemaTypes.span, {text: ' '})
        }
      }
    },
    [editor, selectionAtMentionInsert],
  )

  const ctxValue = useMemo(
    (): CommentInputContextValue => ({
      canSubmit,
      closeMentions,
      editor,
      expandOnFocus,
      focused,
      focusEditor,
      focusOnMount,
      hasChanges,
      insertAtChar,
      insertMention,
      mentionOptions,
      mentionsMenuOpen,
      mentionsSearchTerm,
      onBeforeInput,
      openMentions,
      readOnly: Boolean(readOnly),
      value,
    }),
    [
      canSubmit,
      closeMentions,
      editor,
      expandOnFocus,
      focused,
      focusEditor,
      focusOnMount,
      hasChanges,
      insertAtChar,
      insertMention,
      mentionOptions,
      mentionsMenuOpen,
      mentionsSearchTerm,
      onBeforeInput,
      openMentions,
      readOnly,
      value,
    ],
  )

  return <CommentInputContext.Provider value={ctxValue}>{children}</CommentInputContext.Provider>
}
