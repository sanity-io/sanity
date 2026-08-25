import {
  type Editor,
  type EditorEmittedEvent,
  EditorProvider,
  keyGenerator,
  useEditor,
} from '@portabletext/editor'
import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {getValue} from '@portabletext/editor/selectors'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {sanitySchemaToPortableTextSchema} from '@portabletext/sanity-bridge'
import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {type AvatarSize, focusFirstDescendant, focusLastDescendant, Stack} from '@sanity/ui'
import {
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefAttributes,
} from 'react'

import {type UserListWithPermissionsHookValue} from '../../../../hooks/useUserListWithPermissions'
import {NormalBlock} from '../blocks/NormalBlock'
import {editorSchemaType} from '../config'
import {CommentInputDiscardDialog} from './CommentInputDiscardDialog'
import {CommentInputInner} from './CommentInputInner'
import {CommentInputProvider} from './CommentInputProvider'

/**
 * `EditorProvider` doesn't have a `ref` prop. This plugin takes care of
 * imperatively forwarding the editor instance.
 */
function EditorRefPlugin(props: RefAttributes<Editor | null>) {
  const {ref} = props
  const editor = useEditor()

  useImperativeHandle(ref, () => editor, [editor])

  return null
}
EditorRefPlugin.displayName = 'EditorRefPlugin'

const EMPTY_ARRAY: [] = []

const defaultRenderBlock = ({children}: {children: ReactNode}) => (
  <NormalBlock>{children}</NormalBlock>
)

/**
 * @internal
 */
export type CommentInputRenderBlock = (props: {children: React.ReactNode}) => React.JSX.Element

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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  onBlur?: (e: FormEvent<HTMLDivElement>) => void
  onChange: (value: PortableTextBlock[]) => void
  onDiscardCancel?: () => void
  onDiscardConfirm: () => void
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  onFocus?: (e: FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onMentionMenuOpenChange?: (open: boolean) => void
  onSubmit?: (value: PortableTextBlock[]) => void
  placeholder?: ReactNode
  readOnly?: boolean
  renderBlock?: CommentInputRenderBlock
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
export function CommentInput(props: CommentInputProps & RefAttributes<CommentInputHandle>) {
  const {
    ref,
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
  const editorRef = useRef<Editor | null>(null)
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const resetInstanceRef = useRef(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState<boolean>(false)

  const preDivRef = useRef<HTMLDivElement | null>(null)
  const postDivRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)

  // A unique (React) key for the editor instance.
  const [editorInstanceKey, setEditorInstanceKey] = useState(keyGenerator())

  const requestFocus = useCallback(() => {
    requestAnimationFrame(() => {
      editorRef.current?.send({type: 'focus'})
    })
  }, [])

  const resetEditorInstance = useCallback(() => {
    // The discarded instance flushes pending mutations during teardown; drop
    // them in `handleEvent` so a finished draft cannot overwrite the
    // consumer's cleared draft state.
    resetInstanceRef.current = true
    setEditorInstanceKey(keyGenerator())
  }, [])

  const handleEvent = useCallback(
    (event: EditorEmittedEvent) => {
      // Focus the editor when ready if focusOnMount is true
      if (event.type === 'ready') {
        resetInstanceRef.current = false
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
      if (event.type === 'mutation' && !resetInstanceRef.current) {
        onChange(event.value || EMPTY_ARRAY)
      }
    },
    [focusOnMount, onChange, requestFocus],
  )

  const scrollToEditor = useCallback(() => {
    editorContainerRef.current?.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
  }, [])

  const handleSubmit = useCallback(() => {
    // Read the editor's live value directly rather than the value mirrored
    // through the debounced `mutation` event, which can lag the latest
    // keystrokes by up to the flush interval and truncate the comment when
    // the user submits without pausing.
    const currentValue = editorRef.current ? getValue(editorRef.current.getSnapshot()) : EMPTY_ARRAY
    onSubmit?.(currentValue)
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
        editorRef.current?.send({type: 'blur'})
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
}

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
