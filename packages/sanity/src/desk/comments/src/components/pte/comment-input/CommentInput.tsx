import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {EditorChange, PortableTextEditor} from '@sanity/portable-text-editor'
import {CurrentUser, PortableTextBlock} from '@sanity/types'
import FocusLock from 'react-focus-lock'
import {Stack} from '@sanity/ui'
import {editorSchemaType} from '../config'
import {MentionOptionsHookValue} from '../../../types'
import {hasCommentMessageValue} from '../../../helpers'
import {CommentInputInner} from './CommentInputInner'
import {CommentInputProvider} from './CommentInputProvider'
import {CommentInputDiscardDialog} from './CommentInputDiscardDialog'

const EMPTY_ARRAY: [] = []

interface CommentInputProps {
  currentUser: CurrentUser
  expandOnFocus?: boolean
  focusLock?: boolean
  focusOnMount?: boolean
  mentionOptions: MentionOptionsHookValue
  onChange: (value: PortableTextBlock[]) => void
  onDiscardCancel: () => void
  onDiscardConfirm: () => void
  onEscapeKeyDown?: () => void
  onMentionMenuOpenChange?: (open: boolean) => void
  onSubmit: () => void
  placeholder?: string
  value: PortableTextBlock[] | null
  withAvatar?: boolean
}

interface CommentDiscardController {
  /**
   * Starts the discard process by showing a dialog if there is a value to be discarded.
   */
  start: () => {
    callback: (fn: (needsConfirm: boolean) => void) => void
  }
  /**
   * Confirms the discard process and closes the confirm dialog and focuses the editor.
   */
  confirm: () => {
    callback: (fn: () => void) => void
  }
  /** Cancels the discard process and closes the confirm dialog and focuses the editor. */
  cancel: () => {
    callback: (fn: () => void) => void
  }
}

export interface CommentInputHandle {
  blur: () => void
  discardController: CommentDiscardController
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
      onChange,
      onDiscardCancel,
      onDiscardConfirm,
      onEscapeKeyDown,
      onMentionMenuOpenChange,
      onSubmit,
      placeholder,
      value = [],
      withAvatar = true,
    } = props
    const [focused, setFocused] = useState<boolean>(false)
    const editorRef = useRef<PortableTextEditor | null>(null)
    const editorContainerRef = useRef<HTMLDivElement | null>(null)
    const [showDiscardDialog, setShowDiscardDialog] = useState<boolean>(false)

    const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

    const handleChange = useCallback(
      (change: EditorChange) => {
        if (change.type === 'focus') {
          setFocused(true)
        }

        if (change.type === 'blur') {
          setFocused(false)
        }

        if (change.type === 'mutation' && change.snapshot) {
          onChange(change.snapshot)
        }
      },
      [onChange],
    )

    const scrollToEditor = useCallback(() => {
      editorContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }, [])

    // The way a user a comment can be discarded varies from the context it is used in.
    // This controller is used to take care of the main logic of the discard process, while
    // specific behavior is handled by the consumer.
    const discardController: CommentDiscardController = useMemo(() => {
      return {
        start: () => {
          const needsConfirm = hasValue

          if (needsConfirm) {
            setShowDiscardDialog(true)
            return {
              callback: (fn: (needsConfirm: boolean) => void) => {
                fn(true)
              },
            }
          }

          return {
            callback: (fn: (needsConfirm: boolean) => void) => {
              fn(false)
            },
          }
        },
        confirm: () => {
          setShowDiscardDialog(false)
          if (editorRef?.current) {
            PortableTextEditor.focus(editorRef.current)
          }

          return {
            callback: (fn) => fn(),
          }
        },
        cancel: () => {
          setShowDiscardDialog(false)
          if (editorRef?.current) {
            PortableTextEditor.focus(editorRef.current)
          }

          return {
            callback: (fn) => fn(),
          }
        },
      }
    }, [hasValue])

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

          discardController,
        }
      },
      [discardController, scrollToEditor],
    )

    return (
      <>
        {showDiscardDialog && (
          <CommentInputDiscardDialog onClose={onDiscardCancel} onConfirm={onDiscardConfirm} />
        )}

        <Stack ref={editorContainerRef}>
          <PortableTextEditor
            onChange={handleChange}
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
                  onEscapeKeyDown={onEscapeKeyDown}
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
