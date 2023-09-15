import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo, useState} from 'react'
import {Path, isKeySegment, isPortableTextSpan, isPortableTextTextBlock} from '@sanity/types'
import {CommentMessage} from '../../../types'
import {useDidUpdate} from '../../../../form'
import {useCommentHasChanged} from '../../../helpers'
import {MentionOptionsHookValue} from '../../../hooks'

export interface CommentInputContextValue {
  canSubmit?: boolean
  closeMentions: () => void
  editor: PortableTextEditor
  expanded?: boolean
  expandOnFocus?: boolean
  focused: boolean
  focusEditor: () => void
  focusOnMount?: boolean
  hasChanges: boolean
  insertAtChar: () => void
  insertMention: (userId: string) => void
  mentionOptions: MentionOptionsHookValue
  mentionsMenuOpen: boolean
  onBeforeInput: (event: InputEvent) => void
  openMentions: () => void
  mentionsSearchTerm: string
  value: CommentMessage
}

export const CommentInputContext = React.createContext<CommentInputContextValue | null>(null)

interface CommentInputProviderProps {
  children: React.ReactNode
  expanded?: boolean
  expandOnFocus?: boolean
  focused: boolean
  focusOnMount?: boolean
  mentionOptions: MentionOptionsHookValue
  onMentionMenuOpenChange?: (open: boolean) => void
  value: CommentMessage
}

export function CommentInputProvider(props: CommentInputProviderProps) {
  const {
    children,
    expanded,
    expandOnFocus = false,
    focused,
    focusOnMount = false,
    mentionOptions,
    onMentionMenuOpenChange,
    value,
  } = props

  const editor = usePortableTextEditor()

  const [mentionsMenuOpen, setMentionsMenuOpen] = useState<boolean>(false)
  const [mentionsSearchTerm, setMentionsSearchTerm] = useState<string>('')
  const [selectionAtMentionInsert, setSelectionAtMentionInsert] = useState<EditorSelection>(null)

  const canSubmit = useMemo(() => {
    if (!value) return false

    return value?.some(
      (block) =>
        isPortableTextTextBlock(block) &&
        (block?.children || [])?.some((c) => (isPortableTextSpan(c) ? c.text : c.userId)),
    )
  }, [value])

  const hasChanges = useCommentHasChanged(value)

  const focusEditor = useCallback(() => PortableTextEditor.focus(editor), [editor])

  const closeMentions = useCallback(() => {
    setMentionsMenuOpen(false)
    setMentionsSearchTerm('')
    setSelectionAtMentionInsert(null)
    focusEditor()
  }, [focusEditor])

  const openMentions = useCallback(() => {
    setMentionsMenuOpen(true)
    setMentionsSearchTerm('')
    setMentionsMenuOpen(true)
    setSelectionAtMentionInsert(PortableTextEditor.getSelection(editor))
    focusEditor()
  }, [focusEditor, editor])

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
          mentionPath = PortableTextEditor.insertChild(editor, mentionSchemaType, {
            _type: 'mention',
            userId: userId,
          })
        }

        const focusBlock = PortableTextEditor.focusBlock(editor)

        // Set the focus on the next text node after the mention object
        if (focusBlock && isPortableTextTextBlock(focusBlock) && mentionPath) {
          const mentionKeyPathSegment = mentionPath?.slice(-1)[0]
          const nextChildKey =
            focusBlock.children[
              focusBlock.children.findIndex(
                (c) => isKeySegment(mentionKeyPathSegment) && c._key === mentionKeyPathSegment._key,
              ) + 1
            ]?._key

          if (nextChildKey) {
            const path: Path = [{_key: focusBlock._key}, 'children', {_key: nextChildKey}]
            const sel: EditorSelection = {
              anchor: {path, offset: 0},
              focus: {path, offset: 0},
            }
            PortableTextEditor.select(editor, sel)
            PortableTextEditor.focus(editor)
          }
        }
      }

      closeMentions()
    },
    [closeMentions, editor, selectionAtMentionInsert],
  )

  const ctxValue = useMemo(
    () =>
      ({
        canSubmit,
        closeMentions,
        editor,
        expanded,
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
        value,
      }) satisfies CommentInputContextValue,
    [
      canSubmit,
      closeMentions,
      editor,
      expanded,
      expandOnFocus,
      focused,
      focusEditor,
      focusOnMount,
      hasChanges,
      insertAtChar,
      insertMention,
      mentionsMenuOpen,
      mentionsSearchTerm,
      onBeforeInput,
      openMentions,
      value,
      mentionOptions,
    ],
  )

  return <CommentInputContext.Provider value={ctxValue}>{children}</CommentInputContext.Provider>
}
