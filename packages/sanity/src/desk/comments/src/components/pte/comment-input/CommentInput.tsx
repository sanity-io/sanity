import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {EditorChange, PortableTextEditor} from '@sanity/portable-text-editor'
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

    const handleChange = useCallback(
      (change: EditorChange) => {
        // Focus the editor when ready if focusOnMount is true
        if (change.type === 'ready') {
          if (focusOnMount && editorRef.current) {
            requestAnimationFrame(() => {
              if (!editorRef.current) return
              PortableTextEditor.focus(editorRef.current)
            })
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
          if (editorStateValue) {
            onChange(editorStateValue)
          }
        }
      },
      [focusOnMount, onChange],
    )

    const scrollToEditor = useCallback(() => {
      editorContainerRef.current?.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
    }, [])

    // The way a user a comment can be discarded varies from the context it is used in.
    // This controller is used to take care of the main logic of the discard process, while
    // specific behavior is handled by the consumer.
    const discardDialogController = useMemo(() => {
      return {
        open: () => {
          if (editorRef?.current) {
            PortableTextEditor.blur(editorRef.current)
          }

          setShowDiscardDialog(true)
        },
        close: () => {
          setShowDiscardDialog(false)

          if (editorRef?.current) {
            PortableTextEditor.focus(editorRef.current)
          }
        },
      } satisfies CommentDiscardDialogController
    }, [])

    useImperativeHandle(
      ref,
      () => {
        return {
          focus() {
            if (editorRef?.current) {
              PortableTextEditor.focus(editorRef.current)
            }
          },
          blur() {
            if (editorRef?.current) {
              PortableTextEditor.blur(editorRef.current)
            }
          },
          scrollTo: scrollToEditor,

          discardDialogController,
        }
      },
      [discardDialogController, scrollToEditor],
    )

    return (
      <>
        {showDiscardDialog && (
          <CommentInputDiscardDialog onClose={onDiscardCancel} onConfirm={onDiscardConfirm} />
        )}

        <Stack ref={editorContainerRef} data-testid="comment-input">
          <PortableTextEditor
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
                  onSubmit={onSubmit}
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
