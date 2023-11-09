import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {EditorChange, PortableTextEditor, keyGenerator} from '@sanity/portable-text-editor'
import {CurrentUser, PortableTextBlock} from '@sanity/types'
import {Stack, focusFirstDescendant, focusLastDescendant} from '@sanity/ui'
import {editorSchemaType} from '../config'
import {MentionOptionsHookValue} from '../../../types'
import {CommentInputInner} from './CommentInputInner'
import {CommentInputProvider} from './CommentInputProvider'
import {CommentInputDiscardDialog} from './CommentInputDiscardDialog'

const EMPTY_ARRAY: [] = []

const SCROLL_INTO_VIEW_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'center',
  inline: 'center',
}

export interface CommentInputProps {
  currentUser: CurrentUser
  expandOnFocus?: boolean
  focusLock?: boolean
  focusOnMount?: boolean
  mentionOptions: MentionOptionsHookValue
  onBlur?: (e: React.FormEvent<HTMLDivElement>) => void
  onChange: (value: PortableTextBlock[]) => void
  onDiscardCancel: () => void
  onDiscardConfirm: () => void
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<Element>) => void
  onMentionMenuOpenChange?: (open: boolean) => void
  onSubmit: () => void
  placeholder?: React.ReactNode
  readOnly?: boolean
  value: PortableTextBlock[] | null
  withAvatar?: boolean
}

interface CommentDiscardDialogController {
  open: () => void
  close: () => void
}

export interface CommentInputHandle {
  blur: () => void
  discardDialogController: CommentDiscardDialogController
  focus: () => void
  scrollTo: () => void
  reset: () => void
}

/**
 * @beta
 * @hidden
 */
export const CommentInput = forwardRef<CommentInputHandle, CommentInputProps>(
  function CommentInput(props, ref) {
    const {
      currentUser,
      expandOnFocus,
      focusLock = false,
      focusOnMount,
      mentionOptions,
      onBlur,
      onChange,
      onDiscardCancel,
      onDiscardConfirm,
      onFocus,
      onKeyDown,
      onMentionMenuOpenChange,
      onSubmit,
      placeholder,
      readOnly,
      value = EMPTY_ARRAY,
      withAvatar = true,
    } = props
    const [focused, setFocused] = useState<boolean>(false)
    const editorRef = useRef<PortableTextEditor | null>(null)
    const editorContainerRef = useRef<HTMLDivElement | null>(null)
    const [showDiscardDialog, setShowDiscardDialog] = useState<boolean>(false)

    const preDivRef = useRef<HTMLDivElement | null>(null)
    const postDivRef = useRef<HTMLDivElement | null>(null)
    const innerRef = useRef<HTMLDivElement | null>(null)

    // A unique (React) key for the editor instance.
    const [editorInstanceKey, setEditorInstanceKey] = useState(keyGenerator())

    const requestFocus = useCallback(() => {
      requestAnimationFrame(() => {
        if (!editorRef.current) return
        PortableTextEditor.focus(editorRef.current)
      })
    }, [])

    const resetEditorInstance = useCallback(() => {
      setEditorInstanceKey(keyGenerator())
    }, [])

    const handleChange = useCallback(
      (change: EditorChange) => {
        // Focus the editor when ready if focusOnMount is true
        if (change.type === 'ready') {
          if (focusOnMount) {
            requestFocus()
          }
        }
        if (change.type === 'focus') {
          setFocused(true)
        }

        if (change.type === 'blur') {
          setFocused(false)
        }

        // Update the comment value whenever the comment is edited by the user.
        if (change.type === 'patch' && editorRef.current) {
          const editorStateValue = PortableTextEditor.getValue(editorRef.current)
          onChange(editorStateValue || EMPTY_ARRAY)
        }
      },
      [focusOnMount, onChange, requestFocus],
    )

    const scrollToEditor = useCallback(() => {
      editorContainerRef.current?.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
    }, [])

    const handleSubmit = useCallback(() => {
      onSubmit()
      resetEditorInstance()
      requestFocus()
      scrollToEditor()
    }, [onSubmit, requestFocus, resetEditorInstance, scrollToEditor])

    const handleDiscardConfirm = useCallback(() => {
      onDiscardConfirm()
      resetEditorInstance()
    }, [onDiscardConfirm, resetEditorInstance])

    // The way a user a comment can be discarded varies from the context it is used in.
    // This controller is used to take care of the main logic of the discard process, while
    // specific behavior is handled by the consumer.
    const discardDialogController = useMemo((): CommentDiscardDialogController => {
      return {
        open: () => {
          setShowDiscardDialog(true)
        },
        close: () => {
          setShowDiscardDialog(false)
          requestFocus()
        },
      }
    }, [requestFocus])

    useImperativeHandle(
      ref,
      () => {
        return {
          focus: requestFocus,
          blur() {
            if (editorRef.current) {
              PortableTextEditor.blur(editorRef.current)
            }
          },
          scrollTo: scrollToEditor,
          reset: resetEditorInstance,

          discardDialogController,
        }
      },
      [discardDialogController, requestFocus, resetEditorInstance, scrollToEditor],
    )

    const handleFocus = useCallback(
      (event: React.FocusEvent<HTMLDivElement>) => {
        if (!focusLock) return

        const target = event.target
        const innerEl = innerRef.current

        if (innerEl && target === preDivRef.current) {
          focusLastDescendant(innerEl)
          return
        }

        if (innerEl && target === postDivRef.current) {
          focusFirstDescendant(innerEl)
        }
      },
      [focusLock],
    )

    return (
      <>
        {showDiscardDialog && (
          <CommentInputDiscardDialog onClose={onDiscardCancel} onConfirm={handleDiscardConfirm} />
        )}

        <Stack ref={editorContainerRef} data-testid="comment-input" onFocus={handleFocus}>
          <PortableTextEditor
            key={editorInstanceKey}
            onChange={handleChange}
            readOnly={readOnly}
            ref={editorRef}
            schemaType={editorSchemaType}
            value={value || EMPTY_ARRAY}
          >
            <CommentInputProvider
              expandOnFocus={expandOnFocus}
              focused={focused}
              focusOnMount={focusOnMount}
              mentionOptions={mentionOptions}
              onMentionMenuOpenChange={onMentionMenuOpenChange}
              readOnly={readOnly}
              value={value}
            >
              {focusLock && <div ref={preDivRef} tabIndex={0} />}

              <Stack ref={innerRef}>
                <CommentInputInner
                  currentUser={currentUser}
                  focusLock={focusLock}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  onKeyDown={onKeyDown}
                  onSubmit={handleSubmit}
                  placeholder={placeholder}
                  withAvatar={withAvatar}
                />
              </Stack>

              {focusLock && <div ref={postDivRef} tabIndex={0} />}
            </CommentInputProvider>
          </PortableTextEditor>
        </Stack>
      </>
    )
  },
)
