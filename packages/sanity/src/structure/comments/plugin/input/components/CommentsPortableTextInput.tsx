import {
  EditorChange,
  EditorSelection,
  PortableTextEditor,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react'
import {isEqual} from 'lodash'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {toPlainText} from '@portabletext/react'
import {AddCommentIcon} from '@sanity/icons'
import {
  CommentMessage,
  buildRangeDecorators,
  buildTextSelectionFromFragment,
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
  const {mentionOptions, comments, operation, onCommentsOpen, getComment} = useComments()
  const {setSelectedPath} = useCommentsSelectedPath()

  const editorRef = useRef<PortableTextEditor | null>(null)

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage | null>(null)
  const [nextCommentSelection, setNextCommentSelection] = useState<EditorSelection | null>(null)
  const [currentSelectionPlainText, setCurrentSelectionPlainText] = useState<string | null>(null)
  const [currentHoveredCommentId, setCurrentHoveredCommentId] = useState<string | null>(null)

  const [canSubmit, setCanSubmit] = useState<boolean>(false)

  const rootElementRef = useMemo(() => props.elementProps.ref, [props.elementProps.ref])
  const currentSelectionRef = useRef<EditorSelection | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const fieldComments = useMemo(() => {
    return comments.data.open?.filter((comment) => comment.fieldPath === stringFieldPath)
  }, [comments, stringFieldPath])

  const getFragment = useCallback(() => {
    if (!editorRef.current) return EMPTY_ARRAY
    return PortableTextEditor.getFragment(editorRef.current)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!nextCommentSelection || !editorRef.current) return

    const fragment = getFragment() || EMPTY_ARRAY
    const textSelection = buildTextSelectionFromFragment({fragment})

    operation.create({
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      // This is a new comment, so we don't have a parent comment id
      parentCommentId: undefined,
      selection: textSelection,
      status: 'open',
      // This is a new comment, so we need to generate a new thread id
      threadId: uuid(),
      reactions: EMPTY_ARRAY,
    })

    // Reset the states when submitting
    setNextCommentValue(null)
    setNextCommentSelection(null)
    currentSelectionRef.current = null
  }, [getFragment, nextCommentSelection, nextCommentValue, operation, stringFieldPath])

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
    (change: EditorChange) => {
      if (change.type === 'selection') {
        const hasSelectionRange = !isEqual(change.selection, nextCommentSelection)

        if (hasSelectionRange) {
          // Store the current selection in a ref so that, when clicking the "add comment"
          // button, we use the selection and set it as the current selection state so that
          // the popover opens with the selection.
          currentSelectionRef.current = change.selection

          const fragment = getFragment()
          const plainTextValue = fragment ? toPlainText(fragment) : null

          // Check if the selection is valid. A valid selection is a selection that only
          // contains text blocks. If the selection contains other types of blocks, we
          // should not allow the user to add a comment and we disable the "add comment"
          // button.
          const isValidSelection = fragment?.every(isPortableTextTextBlock)

          setCanSubmit(Boolean(isValidSelection))
          setCurrentSelectionPlainText(plainTextValue)
        } else {
          currentSelectionRef.current = null
          setCurrentSelectionPlainText(null)
          setCanSubmit(false)
        }
      }
    },
    [getFragment, nextCommentSelection],
  )

  const handleDecoratorClick = useCallback(
    (commentId: string) => {
      const comment = getComment(commentId)

      if (!comment) return

      setSelectedPath({
        fieldPath: comment.target.path.field,
        threadId: comment.threadId,
        origin: 'form',
      })

      onCommentsOpen?.()

      // Temporary fix for scrolling to the comment thread when clicking the comment
      requestAnimationFrame(() => {
        const node = document.querySelector(`[data-group-id="${comment.threadId}"]`)

        node?.scrollIntoView({
          behavior: 'smooth',
        })
      })
    },
    [getComment, onCommentsOpen, setSelectedPath],
  )

  // The range decorations for existing comments
  const addCommentsDecorators = useMemo(() => {
    const commentsWithTextSelection = fieldComments.filter((c) => c.selection?.type === 'text')

    return buildRangeDecorators({
      comments: commentsWithTextSelection,
      value: props.value,
      currentHoveredCommentId,
      onDecoratorHoverEnd: setCurrentHoveredCommentId,
      onDecoratorHoverStart: setCurrentHoveredCommentId,
      onDecoratorClick: handleDecoratorClick,
    })
  }, [currentHoveredCommentId, fieldComments, handleDecoratorClick, props.value])

  const rangeDecorations = useMemo((): RangeDecoration[] => {
    const nextCommentDecorator: RangeDecoration = {
      component: ({children}) => (
        <HighlightSpan data-inline-comment-state="authoring">{children}</HighlightSpan>
      ),
      isRangeInvalid,
      selection: nextCommentSelection,
    }

    const authoringDecorator = nextCommentSelection ? [nextCommentDecorator] : EMPTY_ARRAY

    return [
      // Existing range decorations
      ...(props?.rangeDecorations || EMPTY_ARRAY),
      // The range decoration when adding a comment
      ...authoringDecorator,
      // The range decorations for existing comments
      ...addCommentsDecorators,
    ]
  }, [addCommentsDecorators, nextCommentSelection, props?.rangeDecorations])

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
      editorRef,
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
