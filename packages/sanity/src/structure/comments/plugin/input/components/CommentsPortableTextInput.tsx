import {
  EditorChange,
  EditorSelection,
  PortableTextEditor,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import {Stack, Grid} from '@sanity/ui'
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
import {CommentMessage, CommentThreadItem, useComments, useCommentsEnabled} from '../../../src'
import {Button, PopoverProps} from '../../../../../ui-components'
import {createDomRectFromElements} from '../helpers'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'
import {HighlightSpan} from './HighlightSpan'

import {PortableTextInputProps, isPortableTextTextBlock, useCurrentUser} from 'sanity'

const EMPTY_ARRAY: [] = []

function isRangeInvalid() {
  return false
}

function AddCommentDecorator(props: PropsWithChildren) {
  const {children} = props
  return <HighlightSpan data-inline-comment-state="authoring">{children}</HighlightSpan>
}

function CommentDecorator(props: PropsWithChildren<{commentId: string}>) {
  const {children, commentId} = props
  return (
    <HighlightSpan data-inline-comment-state="added" data-inline-comment-id={commentId}>
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
  const {mentionOptions, comments, create, edit} = useComments()

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage | null>(null)
  const [nextCommentSelection, setNextCommentSelection] = useState<EditorSelection | null>(null)
  const [currentSelectionPlainText, setCurrentSelectionPlainText] = useState<string | null>(null)

  const [canSubmit, setCanSubmit] = useState<boolean>(false)

  const currentSelectionRef = useRef<EditorSelection | null>(null)
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const fieldComments = useMemo(() => {
    return comments.data.open?.filter((comment) => comment.fieldPath === stringFieldPath)
  }, [comments, stringFieldPath])

  const handleSubmit = useCallback(() => {
    if (!nextCommentSelection) return

    create.execute({
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      // This is a new comment, so we don't have a parent comment id
      parentCommentId: undefined,
      selection: nextCommentSelection,
      status: 'open',
      // This is a new comment, so we need to generate a new thread id
      threadId: uuid(),

      // TODO: add this
      // documentValueSnapshot: currentSelectionPlainText
    })

    // Reset the states when submitting
    setNextCommentValue(null)
    setNextCommentSelection(null) // Rename to setNextCommentSelection
    currentSelectionRef.current = null
  }, [create, nextCommentSelection, nextCommentValue, stringFieldPath])

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
      if (change.type === 'rangeDecorationMoved') {
        const comment = change.rangeDecoration.payload?.comment as CommentThreadItem
        // console.log(
        //   `Decorator range changed affecting comment ${comment.parentComment._id}`,
        //   `From offset ${change.rangeDecoration?.selection?.focus?.offset} to ${change.newRangeSelection?.focus?.offset}`,
        // )
        edit.execute(comment.parentComment._id, {
          selection: change.newRangeSelection,
        })
        return
      }
      if (change.type === 'selection') {
        if (!PortableTextEditor.isExpandedSelection(editor)) {
          return
        }
        const hasSelectionRange = !isEqual(change.selection, nextCommentSelection)

        // TODO: the below seems like a bit too much to do right here.
        // This callback function, especially for the frequently called selection change,
        // should only do the bare minimum. We should probably move this logic to a separate
        // function where the comment is created.

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
    [edit, nextCommentSelection],
  )

  // The range decorations for existing comments
  const commentDecorators = useMemo(
    () =>
      fieldComments
        .map((comment) => {
          if (!comment.selection) return null
          const decorator: RangeDecoration = {
            component: ({children}) => (
              <CommentDecorator commentId={comment.parentComment._id}>{children}</CommentDecorator>
            ),
            isRangeInvalid,
            selection: comment.selection,
            payload: {comment},
          }

          return decorator
        })
        .filter(Boolean) as RangeDecoration[],

    [fieldComments],
  )

  const rangeDecorations = useMemo((): RangeDecoration[] => {
    const currentRangeDecoration: RangeDecoration = {
      component: AddCommentDecorator,
      isRangeInvalid,
      selection: nextCommentSelection,
    }

    const currentDecorator = nextCommentSelection ? [currentRangeDecoration] : EMPTY_ARRAY
    const result = [
      // Existing range decorations
      ...(props?.rangeDecorations || EMPTY_ARRAY),
      // The range decoration when adding a comment
      ...currentDecorator,
      // The range decorations for existing comments
      ...commentDecorators,
    ]
    if (result.length > 0) {
      return result
    }
    return EMPTY_ARRAY
  }, [commentDecorators, nextCommentSelection, props?.rangeDecorations])

  // Construct a virtual element used to position the popover relative to the selection.
  const popoverReferenceElement = useMemo((): PopoverProps['referenceElement'] => {
    if (!rect) return null

    return {
      getBoundingClientRect: () => rect,
    } as HTMLElement
  }, [rect])

  // The props passed to the portable text input
  const inputProps = useMemo(
    (): PortableTextInputProps => ({
      ...props,
      onEditorChange,
      rangeDecorations,
    }),
    [props, onEditorChange, rangeDecorations],
  )

  // This effect will run when the current selection changes and will calculate the
  // bounding box for the selection and set it as the rect state. This is used to
  // position the popover.
  useEffect(() => {
    // Get all the elements that have the `data-inline-comment-state="authoring"` attribute
    const elements = rootElementRef.current?.querySelectorAll(
      '[data-inline-comment-state="authoring"]',
    )

    // Create a DOMRect from the elements. This is used to position the popover.
    const nextRect = createDomRectFromElements(Array.from(elements || EMPTY_ARRAY))

    const raf = requestAnimationFrame(() => {
      setRect(nextRect)
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [nextCommentSelection])

  return (
    <Fragment key={stringFieldPath}>
      <Stack space={2} ref={rootElementRef}>
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

        <Grid columns={2} gap={2}>
          <Button
            text="Add comment"
            onClick={handleAddSelection}
            disabled={!canSubmit || !currentSelectionPlainText}
          />
        </Grid>
      </Stack>
    </Fragment>
  )
})
