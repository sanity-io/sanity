import {EditorChange, EditorSelection, RangeDecoration} from '@sanity/portable-text-editor'
import {Stack, Grid, BoundaryElementProvider} from '@sanity/ui'
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
import {CommentMessage, useComments, useCommentsEnabled} from '../../../src'
import {Button, PopoverProps} from '../../../../../ui-components'
import {createDomRectFromElements} from '../helpers'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'
import {HighlightSpan} from './HighlightSpan'
import {PortableTextInputProps, useCurrentUser} from 'sanity'

const EMPTY_ARRAY: [] = []

function isRangeInvalid() {
  return false
}

function AddCommentDecorator(props: PropsWithChildren) {
  const {children} = props
  return <HighlightSpan data-comment-state="authoring">{children}</HighlightSpan>
}

function CommentDecorator(props: PropsWithChildren) {
  const {children} = props
  return <HighlightSpan data-comment-state="added">{children}</HighlightSpan>
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
  const {mentionOptions, comments, create} = useComments()

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage | null>(null)

  const [currentSelection, setCurrentSelection] = useState<EditorSelection | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const currentSelectionRef = useRef<EditorSelection | null>(null)
  const rootElementRef = useRef<HTMLDivElement | null>(null)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const fieldComments = useMemo(() => {
    return comments.data.open?.filter((comment) => comment.fieldPath === stringFieldPath)
  }, [comments, stringFieldPath])

  const handleSubmit = useCallback(() => {
    if (!currentSelection) return

    create.execute({
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      // This is a new comment, so we don't have a parent comment id
      parentCommentId: undefined,
      selection: currentSelection,
      status: 'open',
      // This is a new comment, so we need to generate a new thread id
      threadId: uuid(),
    })

    // Reset the states when submitting
    setNextCommentValue(null)
    setCurrentSelection(null)
    currentSelectionRef.current = null
  }, [create, currentSelection, nextCommentValue, stringFieldPath])

  // This will set the current selection state to the current selection ref.
  // When this value is set, the popover with the comment input will open and
  // the comment being added will use the current selection in it's data.
  const handleAddSelection = useCallback(() => {
    setCurrentSelection(currentSelectionRef.current)
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    setNextCommentValue(null)
    setCurrentSelection(null)
  }, [])

  const onClickOutsidePopover = useCallback(() => {
    setRect(null)
    setCurrentSelection(null)
  }, [])

  const onEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'selection') {
        const hasSelectionRange = !isEqual(change.selection, currentSelection)

        if (hasSelectionRange) {
          // Store the current selection in a ref so that, when clicking the "add comment"
          // button, we use the selection and set it as the current selection state so that
          // the popover opens with the selection.
          currentSelectionRef.current = change.selection
        } else {
          currentSelectionRef.current = null
        }
      }
    },
    [currentSelection],
  )

  // The range decorations for existing comments
  const commentDecorators = useMemo(
    () =>
      fieldComments
        .map((comment) => {
          if (!comment.selection) return null

          const addedRangeDecoration: RangeDecoration = {
            component: CommentDecorator,
            isRangeInvalid,
            selection: comment.selection,
          }

          return addedRangeDecoration
        })
        .filter(Boolean) as RangeDecoration[],

    [fieldComments],
  )

  const rangeDecorations = useMemo((): RangeDecoration[] => {
    const currentRangeDecoration: RangeDecoration = {
      component: AddCommentDecorator,
      isRangeInvalid,
      selection: currentSelection,
    }

    const currentDecorator = currentSelection ? [currentRangeDecoration] : EMPTY_ARRAY

    return [
      // Existing range decorations
      ...(props?.rangeDecorations || EMPTY_ARRAY),
      // The range decoration when adding a comment
      ...currentDecorator,
      // The range decorations for existing comments
      ...commentDecorators,
    ]
  }, [commentDecorators, currentSelection, props?.rangeDecorations])

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
    // Get all the elements that have the `data-comment-state="authoring"` attribute
    const elements = rootElementRef.current?.querySelectorAll('[data-comment-state="authoring"]')

    // Create a DOMRect from the elements. This is used to position the popover.
    const nextRect = createDomRectFromElements(Array.from(elements || EMPTY_ARRAY))

    const raf = requestAnimationFrame(() => {
      setRect(nextRect)
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [currentSelection, rect])

  return (
    <Fragment key={stringFieldPath}>
      <BoundaryElementProvider element={rootElementRef.current}>
        {currentUser && (
          <InlineCommentInputPopover
            currentUser={currentUser}
            mentionOptions={mentionOptions}
            onChange={setNextCommentValue}
            onClickOutside={onClickOutsidePopover}
            onDiscardConfirm={handleDiscardConfirm}
            onSubmit={handleSubmit}
            open={!!currentSelection}
            referenceElement={popoverReferenceElement}
            value={nextCommentValue}
          />
        )}
      </BoundaryElementProvider>

      <Stack space={2} ref={rootElementRef}>
        {props.renderDefault(inputProps)}

        <Grid columns={2} gap={2}>
          <Button text="Add comment" onClick={handleAddSelection} />
        </Grid>
      </Stack>
    </Fragment>
  )
})
