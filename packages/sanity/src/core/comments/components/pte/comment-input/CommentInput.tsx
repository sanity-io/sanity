import {
  type Editor,
  type EditorEmittedEvent,
  EditorProvider,
  keyGenerator,
  type RenderBlockFunction,
  useEditor,
  useEditorSelector,
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
 * imperatively forwarding the editor instance.
 */
const EditorRefPlugin = forwardRef<Editor | null>(function EditorRefPlugin(_, ref) {
  const editor = useEditor()

  useImperativeHandle(ref, () => editor, [editor])

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
  onChange?: (value: PortableTextBlock[]) => void
  onDiscardCancel?: () => void
  onDiscardConfirm: () => void
  onFocus?: (e: FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onMentionMenuOpenChange?: (open: boolean) => void
  /**
   * Reports the editor's value whenever it changes. The editor owns the
   * draft; consumers only need this to persist the value continuously (a
   * controlled form input, a draft cache). Composers read at their decision
   * points via `onSubmit`'s argument and the handle's `getValue` instead.
   */
  onSubmit?: (value: PortableTextBlock[]) => void
  placeholder?: ReactNode
  readOnly?: boolean
  renderBlock?: RenderBlockFunction
  /**
   * The initial editor value, and (through `UpdateValuePlugin`) external
   * updates for controlled usages. The editor does not report its own value
   * back through this prop; read it via `onSubmit`, `onChange`, or the
   * handle's `getValue`.
   */
  value?: PortableTextBlock[] | null
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
  getValue: () => PortableTextBlock[]
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
    const editorRef = useRef<Editor | null>(null)
    const editorContainerRef = useRef<HTMLDivElement | null>(null)
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
      },
      [focusOnMount, requestFocus],
    )

    const scrollToEditor = useCallback(() => {
      editorContainerRef.current?.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
    }, [])

    const readCurrentValue = useCallback(() => {
      return editorRef.current ? getValue(editorRef.current.getSnapshot()) : EMPTY_ARRAY
    }, [])

    const handleSubmit = useCallback(() => {
      onSubmit?.(readCurrentValue())
      resetEditorInstance()
      requestFocus()
      scrollToEditor()
    }, [onSubmit, readCurrentValue, requestFocus, resetEditorInstance, scrollToEditor])

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
        getValue: readCurrentValue,
        scrollTo: scrollToEditor,
        reset: resetEditorInstance,

        discardDialogController,
      }
    }, [
      discardDialogController,
      readCurrentValue,
      requestFocus,
      resetEditorInstance,
      scrollToEditor,
    ])

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
            {onChange ? <ValueChangePlugin onChange={onChange} /> : null}
            <OneLinePlugin />
            <UpdateReadOnlyPlugin readOnly={readOnly ?? false} />
            <UpdateValuePlugin value={value ?? undefined} />
            <CommentInputProvider
              expandOnFocus={expandOnFocus}
              focused={focused}
              focusOnMount={focusOnMount}
              initialMessage={value}
              mentionOptions={mentionOptions}
              onMentionMenuOpenChange={onMentionMenuOpenChange}
              readOnly={readOnly}
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
/**
 * Reports the editor's value to the consumer whenever it changes.
 *
 * The subscription is synchronous with the editor's value (no debounce, so a
 * submit never reads a lagging draft) and lives inside the editor instance's
 * React tree (so it dies with the instance and cannot fire during teardown,
 * which used to resurrect a just-submitted draft into the consumer's state).
 */
function ValueChangePlugin(props: {onChange: (value: PortableTextBlock[]) => void}) {
  const {onChange} = props
  const editor = useEditor()
  const value = useEditorSelector(editor, getValue)

  useEffect(() => {
    onChange(value || EMPTY_ARRAY)
  }, [onChange, value])

  return null
}

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
