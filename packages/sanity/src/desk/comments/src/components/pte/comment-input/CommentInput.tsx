import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {EditorChange, PortableTextEditor, keyGenerator} from '@sanity/portable-text-editor'
import {CurrentUser, PortableTextBlock} from '@sanity/types'
import FocusLock from 'react-focus-lock'
import {Stack} from '@sanity/ui'
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
  onEscapeKeyDown?: () => void
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
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
      onEscapeKeyDown,
      onFocus,
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

    // The way a user a comment can be discarded varies from the context it is used in.
    // This controller is used to take care of the main logic of the discard process, while
    // specific behavior is handled by the consumer.
    const discardDialogController = useMemo(() => {
      return {
        open: () => {
          setShowDiscardDialog(true)
        },
        close: () => {
          setShowDiscardDialog(false)
          requestFocus()
        },
      } satisfies CommentDiscardDialogController
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
          reset: () => {
            setEditorInstanceKey(keyGenerator())
          },

          discardDialogController,
        }
      },
      [discardDialogController, requestFocus, scrollToEditor],
    )

    return (
      <>
        {showDiscardDialog && (
          <CommentInputDiscardDialog onClose={onDiscardCancel} onConfirm={onDiscardConfirm} />
        )}

        <Stack ref={editorContainerRef} data-testid="comment-input">
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
              <FocusLock
                as={Stack}
                disabled={!focusLock || showDiscardDialog}
                // returnFocus // This causes issues with focusing the dialog
              >
                <CommentInputInner
                  currentUser={currentUser}
                  focusLock={focusLock}
                  onBlur={onBlur}
                  onEscapeKeyDown={onEscapeKeyDown}
                  onFocus={onFocus}
                  onSubmit={handleSubmit}
                  placeholder={placeholder}
                  withAvatar={withAvatar}
                />
              </FocusLock>
            </CommentInputProvider>
          </PortableTextEditor>
        </Stack>
      </>
    )
  },
)
