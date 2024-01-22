import {
  EditorChange,
  EditorSelection,
  PortableTextEditor,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  PropsWithChildren,
  Fragment,
} from 'react'
import {isEqual} from 'lodash'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {toPlainText} from '@portabletext/react'
import {AddCommentIcon} from '@sanity/icons'
import {
  CommentMessage,
  CommentThreadItem,
  useComments,
  useCommentsEnabled,
  useCommentsSelectedPath,
} from '../../../src'
import {PopoverProps} from '../../../../../ui-components'
import {createDomRectFromElements} from '../helpers'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'
import {HighlightSpan} from './HighlightSpan'
import {
  PortableTextInputProps,
  PortableTextCustomAction,
  isPortableTextTextBlock,
  useCurrentUser,
} from 'sanity'

const EMPTY_ARRAY: [] = []

function isRangeInvalid() {
  return false
}

function AddCommentDecorator(props: PropsWithChildren) {
  const {children} = props
  return <HighlightSpan data-inline-comment-state="authoring">{children}</HighlightSpan>
}

function CommentDecorator(props: PropsWithChildren<{commentId: string; onClick: () => void}>) {
  const {children, commentId, onClick} = props
  return (
    <HighlightSpan
      data-inline-comment-id={commentId}
      data-inline-comment-state="added"
      onClick={onClick}
    >
      {children}
    </HighlightSpan>
  )
}

export function CommentsPortableTextInput(props: PortableTextInputProps) {
  const isEnabled = useCommentsEnabled()

  if (!isEnabled) {
    return props.renderDefault(props)
  }

  return <CommentsPortableTextInputInner {...props} />
}

export const CommentsPortableTextInputInner = React.memo(function CommentsPortableTextInputInner(
  props: PortableTextInputProps,
) {
  const currentUser = useCurrentUser()
  const {mentionOptions, comments, operation, onCommentsOpen} = useComments()
  const {setSelectedPath} = useCommentsSelectedPath()

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage | null>(null)
  const [nextCommentSelection, setNextCommentSelection] = useState<EditorSelection | null>(null)
  const [currentSelectionPlainText, setCurrentSelectionPlainText] = useState<string | null>(null)

  const [canSubmit, setCanSubmit] = useState<boolean>(false)

  const rootElementRef = useMemo(() => props.elementProps.ref, [props.elementProps.ref])
  const currentSelectionRef = useRef<EditorSelection | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const fieldComments = useMemo(() => {
    return comments.data.open?.filter((comment) => comment.fieldPath === stringFieldPath)
  }, [comments, stringFieldPath])

  const handleSubmit = useCallback(() => {
    if (!nextCommentSelection) return

    operation.create({
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      // This is a new comment, so we don't have a parent comment id
      parentCommentId: undefined,
      selection: nextCommentSelection,
      status: 'open',
      // This is a new comment, so we need to generate a new thread id
      threadId: uuid(),

      reactions: [],

      // TODO: add this
      // documentValueSnapshot: currentSelectionPlainText
    })

    // Reset the states when submitting
    setNextCommentValue(null)
    setNextCommentSelection(null) // Rename to setNextCommentSelection
    currentSelectionRef.current = null
  }, [nextCommentSelection, nextCommentValue, operation, stringFieldPath])

  // This will set the current selection state to the current selection ref.
  // When this value is set, the popover with the comment input will open and
  // the comment being added will use the current selection in it's data.
  const handleAddSelection = useCallback(() => {
    setNextCommentSelection(currentSelectionRef.current)
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    setNextCommentValue(null)
    setNextCommentSelection(null)
  }, [])

  const onClickOutsidePopover = useCallback(() => {
    setRect(null)
    setNextCommentSelection(null)
  }, [])

  const onEditorChange = useCallback(
    (change: EditorChange, editor: PortableTextEditor) => {
      if (change.type === 'selection') {
        const hasSelectionRange = !isEqual(change.selection, nextCommentSelection)

        if (hasSelectionRange) {
          // Store the current selection in a ref so that, when clicking the "add comment"
          // button, we use the selection and set it as the current selection state so that
          // the popover opens with the selection.
          currentSelectionRef.current = change.selection

          const valueAtRange = PortableTextEditor.getFragment(editor)
          const plainTextValue = valueAtRange ? toPlainText(valueAtRange) : null

          // Check if the selection is valid. A valid selection is a selection that only
          // contains text blocks. If the selection contains other types of blocks, we
          // should not allow the user to add a comment and we disable the "add comment"
          // button.
          const isValidSelection = valueAtRange?.every(isPortableTextTextBlock)

          setCanSubmit(Boolean(isValidSelection))
          setCurrentSelectionPlainText(plainTextValue)
        } else {
          currentSelectionRef.current = null
          setCurrentSelectionPlainText(null)
          setCanSubmit(false)
        }
      }
    },
    [nextCommentSelection],
  )

  const handleInlineCommentClick = useCallback(
    (comment: CommentThreadItem) => {
      onCommentsOpen?.()
      setSelectedPath({fieldPath: comment.fieldPath, threadId: comment.threadId, origin: 'form'})

      // Temporary fix for scrolling to the comment thread when clicking the comment
      requestAnimationFrame(() => {
        const node = document.querySelector(`[data-group-id="${comment.threadId}"]`)

        node?.scrollIntoView({
          behavior: 'smooth',
        })
      })
    },
    [onCommentsOpen, setSelectedPath],
  )

  // The range decorations for existing comments
  const commentDecorators = useMemo(
    () =>
      fieldComments
        .map((comment) => {
          if (!comment.selection) return null

          const decorator: RangeDecoration = {
            component: ({children}) => (
              <CommentDecorator
                commentId={comment.parentComment._id}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => handleInlineCommentClick(comment)}
              >
                {children}
              </CommentDecorator>
            ),
            isRangeInvalid,
            selection: comment.selection,
          }

          return decorator
        })
        .filter(Boolean) as RangeDecoration[],

    [fieldComments, handleInlineCommentClick],
  )

  const rangeDecorations = useMemo((): RangeDecoration[] => {
    const currentRangeDecoration: RangeDecoration = {
      component: AddCommentDecorator,
      isRangeInvalid,
      selection: nextCommentSelection,
    }

    const currentDecorator = nextCommentSelection ? [currentRangeDecoration] : EMPTY_ARRAY

    return [
      // Existing range decorations
      ...(props?.rangeDecorations || EMPTY_ARRAY),
      // The range decoration when adding a comment
      ...currentDecorator,
      // The range decorations for existing comments
      ...commentDecorators,
    ]
  }, [commentDecorators, nextCommentSelection, props?.rangeDecorations])

  // Construct a virtual element used to position the popover relative to the selection.
  const popoverReferenceElement = useMemo((): PopoverProps['referenceElement'] => {
    if (!rect) return null

    return {
      getBoundingClientRect: () => rect,
    } as HTMLElement
  }, [rect])

  const commentAction = useMemo(
    (): PortableTextCustomAction => ({
      disabled: !canSubmit || !currentSelectionPlainText,
      icon: AddCommentIcon,
      name: 'comment',
      onAction: handleAddSelection,
      title: 'Add comment',
    }),
    [canSubmit, currentSelectionPlainText, handleAddSelection],
  )

  // The props passed to the portable text input
  const inputProps = useMemo(
    (): PortableTextInputProps => ({
      ...props,
      onEditorChange,
      rangeDecorations,
      // eslint-disable-next-line camelcase
      __internal_customActions: (props?.__internal_customActions || EMPTY_ARRAY).concat(
        commentAction,
      ),
    }),
    [props, onEditorChange, rangeDecorations, commentAction],
  )

  // This effect will run when the current selection changes and will calculate the
  // bounding box for the selection and set it as the rect state. This is used to
  // position the popover.
  useEffect(() => {
    if (!rootElementRef.current) return undefined

    // Get all the elements that have the `data-inline-comment-state="authoring"` attribute
    const elements = document?.querySelectorAll('[data-inline-comment-state="authoring"]')

    // Create a DOMRect from the elements. This is used to position the popover.
    const nextRect = createDomRectFromElements(Array.from(elements || EMPTY_ARRAY))

    const raf = requestAnimationFrame(() => {
      setRect(nextRect)
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [nextCommentSelection, rootElementRef])

  return (
    <>
      {currentUser && (
        <InlineCommentInputPopover
          currentUser={currentUser}
          mentionOptions={mentionOptions}
          onChange={setNextCommentValue}
          onClickOutside={onClickOutsidePopover}
          onDiscardConfirm={handleDiscardConfirm}
          onSubmit={handleSubmit}
          open={!!nextCommentSelection}
          referenceElement={popoverReferenceElement}
          value={nextCommentValue}
        />
      )}

      {props.renderDefault(inputProps)}
    </>
  )
})
