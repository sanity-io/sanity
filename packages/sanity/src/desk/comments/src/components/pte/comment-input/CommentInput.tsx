import React, {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react'
import {EditorChange, PortableTextEditor} from '@sanity/portable-text-editor'
import {CurrentUser, PortableTextBlock} from '@sanity/types'
import FocusLock from 'react-focus-lock'
import {Stack} from '@sanity/ui'
import {editorSchemaType} from '../config'
import {MentionOptionsHookValue} from '../../../types'
import {CommentInputInner} from './CommentInputInner'
import {CommentInputProvider} from './CommentInputProvider'

interface CommentInputProps {
  currentUser: CurrentUser
  expandOnFocus?: boolean
  focusLock?: boolean
  focusOnMount?: boolean
  mentionOptions: MentionOptionsHookValue
  onChange: (value: PortableTextBlock[]) => void
  onEditDiscard: () => void
  onMentionMenuOpenChange?: (open: boolean) => void
  onSubmit: () => void
  placeholder?: string
  value: PortableTextBlock[] | null
  withAvatar?: boolean
}

export interface CommentInputHandle {
  blur: () => void
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
      onEditDiscard,
      onMentionMenuOpenChange,
      onSubmit,
      placeholder,
      value,
      withAvatar = true,
    } = props
    const [focused, setFocused] = useState<boolean>(false)
    const editorRef = useRef<PortableTextEditor | null>(null)
    const editorContainerRef = useRef<HTMLDivElement | null>(null)

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
        }
      },
      [scrollToEditor],
    )

    return (
      <Stack ref={editorContainerRef}>
        <PortableTextEditor
          onChange={handleChange}
          schemaType={editorSchemaType}
          value={value || undefined}
          ref={editorRef}
        >
          <CommentInputProvider
            expandOnFocus={expandOnFocus}
            focused={focused}
            focusOnMount={focusOnMount}
            onMentionMenuOpenChange={onMentionMenuOpenChange}
            value={value}
            mentionOptions={mentionOptions}
          >
            <FocusLock returnFocus disabled={!focusLock} as={Stack}>
              <CommentInputInner
                currentUser={currentUser}
                focusLock={focusLock}
                onEditDiscard={onEditDiscard}
                onSubmit={onSubmit}
                placeholder={placeholder}
                withAvatar={withAvatar}
              />
            </FocusLock>
          </CommentInputProvider>
        </PortableTextEditor>
      </Stack>
    )
  },
)
