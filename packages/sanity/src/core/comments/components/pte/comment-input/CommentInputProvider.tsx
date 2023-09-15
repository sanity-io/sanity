import {
  EditorSelection,
  OnBeforeInputFn,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {FormEventHandler, startTransition, useCallback, useMemo, useState} from 'react'
import {Path, isPortableTextSpan, isPortableTextTextBlock} from '@sanity/types'
import {CommentMessage} from '../../../types'
import {useDidUpdate} from '../../../../form'
import {useCommentHasChanged} from '../../../helpers'
import {MentionOptionsHookValue} from '../../../hooks'
import {getCaretElement} from './getCaretElement'

type FIXME = any

export interface CommentInputContextValue {
  activeCaretElement?: HTMLElement | null
  canSubmit?: boolean
  closeMentions: () => void
  editor: PortableTextEditor
  expanded?: boolean
  expandOnFocus?: boolean
  focused: boolean
  focusEditor: () => void
  focusOnMount?: boolean
  hasChanges: boolean
  insertMention: (userId: string) => void
  mentionOptions: MentionOptionsHookValue
  mentionsMenuOpen: boolean
  onBeforeInput: OnBeforeInputFn & FormEventHandler<HTMLDivElement>
  openMentions: () => void
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

  const [activeCaretElement, setActiveCaretElement] = useState<HTMLElement | null>(null)
  const [mentionsMenuOpen, setMentionsMenuOpen] = useState<boolean>(false)
  const [selectionAtMentionInsert, setSelectionAtMentionInsert] = useState<EditorSelection>(null)

  // todo
  const canSubmit = useMemo(() => {
    if (!value) return false

    return value?.some(
      (block: FIXME) => (block?.children || [])?.some((c: FIXME) => c.text || c.userId),
    )
  }, [value])

  const hasChanges = useCommentHasChanged(value)

  const focusLastBlock = useCallback(() => {
    const block = PortableTextEditor.focusBlock(editor)

    try {
      PortableTextEditor.focus(editor)
    } catch (_) {
      // ...
    }

    if (block && isPortableTextTextBlock(block)) {
      const lastChildKey = block.children.slice(-1)[0]?._key

      if (lastChildKey) {
        const path: Path = [{_key: block._key}, 'children', {_key: lastChildKey}]
        const sel: EditorSelection = {
          anchor: {path, offset: 0},
          focus: {path, offset: 0},
        }
        PortableTextEditor.select(editor, sel)
      }
    }
  }, [editor])

  const focusEditor = useCallback(() => setTimeout(() => focusLastBlock(), 0), [focusLastBlock])

  const onBeforeInput = useCallback(
    (event: FIXME): void => {
      if (event.inputType === 'insertText' && event.data === '@') {
        const element = getCaretElement(event.target)
        setActiveCaretElement(element)
        startTransition(() => setMentionsMenuOpen(true))

        setSelectionAtMentionInsert(PortableTextEditor.getSelection(editor))
      }
    },
    [editor],
  )

  const closeMentions = useCallback(() => {
    if (!mentionsMenuOpen) return
    setActiveCaretElement(null)
    setMentionsMenuOpen(false)
    focusEditor()
    setSelectionAtMentionInsert(null)
  }, [focusEditor, mentionsMenuOpen])

  // TODO: check that the editor is focused before opening mentions so that the
  // menu is positioned correctly in the editor
  const openMentions = useCallback(() => {
    focusEditor()
    setTimeout(() => setMentionsMenuOpen(true), 0)
  }, [focusEditor])

  useDidUpdate(mentionsMenuOpen, () => onMentionMenuOpenChange?.(mentionsMenuOpen))

  const insertMention = useCallback(
    (userId: string) => {
      const mentionSchemaType = editor.schemaTypes.inlineObjects.find((t) => t.name === 'mention')
      const spanSchemaType = editor.schemaTypes.span

      const [span, spanPath] =
        (selectionAtMentionInsert &&
          PortableTextEditor.findByPath(editor, selectionAtMentionInsert.focus.path)) ||
        []

      if (span && isPortableTextSpan(span) && spanPath && mentionSchemaType) {
        PortableTextEditor.delete(editor, {
          focus: {path: spanPath, offset: 0},
          anchor: {path: spanPath, offset: span.text.length},
        })

        PortableTextEditor.insertChild(editor, spanSchemaType, {
          ...span,
          text: span.text.substring(0, span.text.length - 1),
        })

        PortableTextEditor.insertChild(editor, mentionSchemaType, {
          _type: 'mention',
          userId: userId,
        })

        const focusBlock = PortableTextEditor.focusBlock(editor)

        if (focusBlock && isPortableTextTextBlock(focusBlock)) {
          const lastChildKey = focusBlock.children.slice(-1)[0]?._key

          if (lastChildKey) {
            const path: Path = [{_key: focusBlock._key}, 'children', {_key: lastChildKey}]
            const sel: EditorSelection = {
              anchor: {path, offset: 0},
              focus: {path, offset: 0},
            }
            PortableTextEditor.select(editor, sel)
          }
        }

        // todo: improve
        // This is needed when the user clicks the mention button in the toolbar
      } else if (mentionSchemaType) {
        PortableTextEditor.insertChild(editor, mentionSchemaType, {
          _type: 'mention',
          userId: userId,
        })
      }

      closeMentions()
    },
    [closeMentions, editor, selectionAtMentionInsert],
  )

  const ctxValue = useMemo(
    () =>
      ({
        activeCaretElement,
        canSubmit,
        closeMentions,
        editor,
        expanded,
        expandOnFocus,
        focused,
        focusEditor,
        focusOnMount,
        hasChanges,
        insertMention,
        mentionsMenuOpen,
        onBeforeInput,
        openMentions,
        value,
        mentionOptions,
      }) satisfies CommentInputContextValue,
    [
      activeCaretElement,
      canSubmit,
      closeMentions,
      editor,
      expanded,
      expandOnFocus,
      focused,
      focusEditor,
      focusOnMount,
      hasChanges,
      insertMention,
      mentionsMenuOpen,
      onBeforeInput,
      openMentions,
      value,
      mentionOptions,
    ],
  )

  return <CommentInputContext.Provider value={ctxValue}>{children}</CommentInputContext.Provider>
}
