import {EditorChange, EditorSelection, RangeDecoration} from '@sanity/portable-text-editor'
import {Stack, Grid} from '@sanity/ui'
import {useState, useRef, useCallback, useMemo, useEffect, PropsWithChildren} from 'react'
import {isEqual} from 'lodash'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {CommentMessage, useComments} from '../../../src'
import {Button} from '../../../../../ui-components'
import {createDomRectFromElements} from '../helpers'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'
import {HighlightSpan} from './HighlightSpan'
import {PortableTextInputProps, useCurrentUser} from 'sanity'

const EMPTY_ARRAY: [] = []

function isRangeInvalid() {
  return false
}

// Adding a highlight decorator
function AddHighlightDecorator(props: PropsWithChildren) {
  const {children} = props

  return <HighlightSpan data-comment-state="authoring">{children}</HighlightSpan>
}

function HighlightDecorator(props: PropsWithChildren) {
  const {children} = props

  return <HighlightSpan data-comment-state="added">{children}</HighlightSpan>
}

export function CommentsPortableTextInput(props: PortableTextInputProps) {
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
      parentCommentId: undefined,
      selection: currentSelection,
      status: 'open',
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
        // Store the current selection in a ref so that, when clicking the "add comment" button, we can
        // use the current selection and set it as the current selection state.
        currentSelectionRef.current = change.selection

        // If the selection is equal, there's no change selected that can be commented on.
        if (isEqual(change.selection, currentSelection)) {
          currentSelectionRef.current = null
        }
      }
    },
    [currentSelection],
  )

  const commentDecorators = useMemo(
    () =>
      fieldComments
        .map((comment) => {
          if (!comment.selection) return null

          const addedRangeDecoration: RangeDecoration = {
            selection: comment.selection,
            component: HighlightDecorator,
            isRangeInvalid,
          }

          return addedRangeDecoration
        })
        .filter(Boolean) as RangeDecoration[],

    [fieldComments],
  )

  const rangeDecorations = useMemo((): RangeDecoration[] => {
    const currentRangeDecoration: RangeDecoration = {
      selection: currentSelection,
      component: AddHighlightDecorator,
      isRangeInvalid,
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

  const referenceElement = useMemo(() => {
    if (!rect) return null

    return {
      getBoundingClientRect: () => rect,
    } as HTMLElement
  }, [rect])

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

  const inputProps = useMemo(
    (): PortableTextInputProps => ({
      ...props,
      onEditorChange,
      rangeDecorations,
    }),
    [props, onEditorChange, rangeDecorations],
  )

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
          open={!!currentSelection}
          referenceElement={referenceElement}
          value={nextCommentValue}
        />
      )}

      <Stack space={2} ref={rootElementRef}>
        {props.renderDefault(inputProps)}

        <Grid columns={2} gap={2}>
          <Button text="Add comment" onClick={handleAddSelection} />
        </Grid>
      </Stack>
    </>
  )
}
