import {
  type EditorEmittedEvent,
  EditorProvider,
  keyGenerator,
  PortableTextEditor,
  type RenderBlockFunction,
  useEditor,
  usePortableTextEditor,
} from '@portabletext/editor'
import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {sanitySchemaToPortableTextSchema} from '@portabletext/sanity-bridge'
import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {type AvatarSize, focusFirstDescendant, focusLastDescendant, Stack} from '@sanity/ui'
import {
  type FocusEvent,
  type FormEvent,
  forwardRef,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import {type UserListWithPermissionsHookValue} from '../../../../hooks'
import {editorSchemaType} from '../config'
import {renderBlock as defaultRenderBlock} from '../render'
import {CommentInputDiscardDialog} from './CommentInputDiscardDialog'
import {CommentInputInner} from './CommentInputInner'
import {CommentInputProvider} from './CommentInputProvider'

/**
 * `EditorProvider` doesn't have a `ref` prop. This plugin takes care of
 * imperatively forwarding the ref.
 */
const EditorRefPlugin = forwardRef<PortableTextEditor | null>(function EditorRefPlugin(_, ref) {
  const portableTextEditor = usePortableTextEditor()
  const portableTextEditorRef = useRef(portableTextEditor)

  useImperativeHandle(ref, () => portableTextEditorRef.current, [])

  return null
})
EditorRefPlugin.displayName = 'EditorRefPlugin'

const EMPTY_ARRAY: [] = []

const SCROLL_INTO_VIEW_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'center',
  inline: 'center',
}

/**
 * @internal
 */
export interface CommentInputProps {
  currentUser: CurrentUser
  expandOnFocus?: boolean
  focusLock?: boolean
  focusOnMount?: boolean
  mentionOptions: UserListWithPermissionsHookValue
  onBlur?: (e: FormEvent<HTMLDivElement>) => void
  onChange: (value: PortableTextBlock[]) => void
  onDiscardCancel?: () => void
  onDiscardConfirm: () => void
  onFocus?: (e: FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onMentionMenuOpenChange?: (open: boolean) => void
  onSubmit?: () => void
  placeholder?: ReactNode
  readOnly?: boolean
  renderBlock?: RenderBlockFunction
  value: PortableTextBlock[] | null
  withAvatar?: boolean
  avatarSize?: AvatarSize
}

interface CommentDiscardDialogController {
  open: () => void
  close: () => void
}

/**
 * @internal
 */
export interface CommentInputHandle {
  blur: () => void
  discardDialogController: CommentDiscardDialogController
  focus: () => void
  scrollTo: () => void
  reset: () => void
}

/**
 * @internal
 * @hidden
 */
export const CommentInput = forwardRef<CommentInputHandle, CommentInputProps>(
  function CommentInput(props, ref) {
    const {
      avatarSize,
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
      renderBlock = defaultRenderBlock,
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

    const handleEvent = useCallback(
      (event: EditorEmittedEvent) => {
        // Focus the editor when ready if focusOnMount is true
        if (event.type === 'ready') {
          if (focusOnMount) {
            requestFocus()
          }
        }
        if (event.type === 'focused') {
          setFocused(true)
        }

        if (event.type === 'blurred') {
          setFocused(false)
        }

        // Update the comment value whenever the comment is edited by the user.
        if (event.type === 'mutation') {
          onChange(event.value || EMPTY_ARRAY)
        }
      },
      [focusOnMount, onChange, requestFocus],
    )

    const scrollToEditor = useCallback(() => {
      editorContainerRef.current?.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
    }, [])

    const handleSubmit = useCallback(() => {
      onSubmit?.()
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

    useImperativeHandle(ref, () => {
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
    }, [discardDialogController, requestFocus, resetEditorInstance, scrollToEditor])

    const handleFocus = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
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
        {showDiscardDialog && onDiscardCancel && (
          <CommentInputDiscardDialog onClose={onDiscardCancel} onConfirm={handleDiscardConfirm} />
        )}

        <Stack ref={editorContainerRef} data-testid="comment-input" onFocus={handleFocus}>
          <EditorProvider
            key={editorInstanceKey}
            initialConfig={{
              schemaDefinition: sanitySchemaToPortableTextSchema(editorSchemaType),
              initialValue: value || EMPTY_ARRAY,
              readOnly,
            }}
          >
            <EditorRefPlugin ref={editorRef} />
            <EventListenerPlugin on={handleEvent} />
            <OneLinePlugin />
            <UpdateReadOnlyPlugin readOnly={readOnly ?? false} />
            <UpdateValuePlugin value={value ?? undefined} />
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
                  avatarSize={avatarSize}
                  currentUser={currentUser}
                  focusLock={focusLock}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  onKeyDown={onKeyDown}
                  onSubmit={onSubmit && handleSubmit}
                  placeholder={placeholder}
                  renderBlock={renderBlock}
                  withAvatar={withAvatar}
                />
              </Stack>

              {focusLock && <div ref={postDivRef} tabIndex={0} />}
            </CommentInputProvider>
          </EditorProvider>
        </Stack>
      </>
    )
  },
)

/**
 * `EditorProvider` doesn't have a `readOnly` prop. This plugin listens for the
 * prop change and sends an `update readOnly` event to the editor.
 */
function UpdateReadOnlyPlugin(props: {readOnly: boolean}) {
  const editor = useEditor()

  useEffect(() => {
    editor.send({
      type: 'update readOnly',
      readOnly: props.readOnly,
    })
  }, [editor, props.readOnly])

  return null
}

/**
 * `EditorProvider` doesn't have a `value` prop. This plugin listens for the
 * prop change and sends an `update value` event to the editor.
 */
function UpdateValuePlugin(props: {value: Array<PortableTextBlock> | undefined}) {
  const editor = useEditor()

  useEffect(() => {
    editor.send({
      type: 'update value',
      value: props.value,
    })
  }, [editor, props.value])

  return null
}
