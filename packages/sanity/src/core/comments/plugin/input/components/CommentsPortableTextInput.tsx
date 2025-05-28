/* eslint-disable max-nested-callbacks */
import {
  type EditorChange,
  type EditorSelection,
  PortableTextEditor,
  type RangeDecoration,
  type RangeDecorationOnMovedDetails,
} from '@portabletext/editor'
import {isPortableTextTextBlock} from '@sanity/types'
import {BoundaryElementProvider, Stack, usePortal} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {AnimatePresence} from 'framer-motion'
import {debounce} from 'lodash'
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {type PortableTextInputProps} from '../../../../form'
import {useCurrentUser} from '../../../../store'
import {CommentInlineHighlightSpan} from '../../../components'
import {isTextSelectionComment} from '../../../helpers'
import {
  useComments,
  useCommentsEnabled,
  useCommentsScroll,
  useCommentsSelectedPath,
  useCommentsUpsell,
} from '../../../hooks'
import {
  type CommentDocument,
  type CommentMessage,
  type CommentsTextSelectionItem,
  type CommentsUIMode,
  type CommentUpdatePayload,
} from '../../../types'
import {
  buildCommentRangeDecorations,
  buildRangeDecorationSelectionsFromComments,
  buildTextSelectionFromFragment,
} from '../../../utils'
import {getSelectionBoundingRect, useAuthoringReferenceElement} from '../helpers'
import {FloatingButtonPopover} from './FloatingButtonPopover'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'

const EMPTY_ARRAY: [] = []

const AI_ASSIST_TYPE = 'sanity.assist.instruction.prompt'

export function CommentsPortableTextInput(props: PortableTextInputProps) {
  const {enabled, mode} = useCommentsEnabled()

  // This is a workaround solution to disable comments for the AI assist type.
  // The AI assist uses the official PTE input which is composed from the
  // Form Components API for the authoring of the prompt. Consequently, the input
  // will get the comments functionality as well, which  we don't want.
  // Therefore we disable the comments for the AI assist type.
  const isAiAssist = props.schemaType.name === AI_ASSIST_TYPE

  if (!enabled || isAiAssist) {
    return props.renderDefault(props)
  }

  return <CommentsPortableTextInputInner {...props} mode={mode} />
}

export const CommentsPortableTextInputInner = memo(function CommentsPortableTextInputInner(
  props: PortableTextInputProps & {mode: CommentsUIMode},
) {
  const {mode} = props
  const currentUser = useCurrentUser()
  const portal = usePortal()

  const {comments, getComment, mentionOptions, onCommentsOpen, operation, setStatus, status} =
    useComments()
  const {setSelectedPath, selectedPath} = useCommentsSelectedPath()
  const {scrollToComment, scrollToGroup} = useCommentsScroll()
  const {handleOpenDialog} = useCommentsUpsell()

  const editorRef = useRef<PortableTextEditor | null>(null)
  const mouseDownRef = useRef<boolean>(false)

  // A reference to the authoring decoration element that highlights the selected text
  // when starting to author a comment.
  const [authoringDecorationElement, setAuthoringDecorationElement] =
    useState<HTMLSpanElement | null>(null)

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage | null>(null)
  const [nextCommentSelection, setNextCommentSelection] = useState<EditorSelection | null>(null)

  const [currentSelection, setCurrentSelection] = useState<EditorSelection | null>(null)
  const [currentSelectionRect, setCurrenSelectionRect] = useState<DOMRect | null>(null)

  const [currentHoveredCommentId, setCurrentHoveredCommentId] = useState<string | null>(null)

  const [canSubmit, setCanSubmit] = useState<boolean>(false)

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [addedCommentsDecorations, setAddedCommentsDecorations] =
    useState<RangeDecoration[]>(EMPTY_ARRAY)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const handleSetCurrentSelectionRect = useCallback(() => {
    const rect = getSelectionBoundingRect()
    setCurrenSelectionRect(rect)
  }, [])

  const resetStates = useCallback(() => {
    setCurrentSelection(null)
    setCurrenSelectionRect(null)
    setNextCommentSelection(null)
    setNextCommentValue(null)
    setCanSubmit(false)
    setAuthoringDecorationElement(null)
  }, [])

  // Set the next comment selection to the current selection so that we can
  // render the comment input popover on the current selection using a range decoration.
  const handleSelectCurrentSelection = useCallback(() => {
    // When trying to add a comment in "upsell" mode, we want to
    // display the upsell dialog instead of the comment input popover.
    if (mode === 'upsell') {
      handleOpenDialog('pte')
      return
    }

    setNextCommentSelection(currentSelection)
  }, [currentSelection, handleOpenDialog, mode])

  // Clear the selection and close the popover when discarding the comment
  const handleCommentDiscardConfirm = useCallback(() => {
    resetStates()
  }, [resetStates])

  const textComments = useMemo(() => {
    return comments.data.open
      .filter((comment) => comment.fieldPath === stringFieldPath)
      .filter((c) => isTextSelectionComment(c.parentComment))
      .map((c) => c.parentComment)
  }, [comments.data.open, stringFieldPath])

  const getFragment = useCallback(() => {
    if (!editorRef.current) return EMPTY_ARRAY
    return PortableTextEditor.getFragment(editorRef.current)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!nextCommentSelection || !editorRef.current) return

    const fragment = getFragment() || EMPTY_ARRAY
    const editorValue = PortableTextEditor.getValue(editorRef.current)

    if (!editorValue) return

    const textSelection = buildTextSelectionFromFragment({
      fragment,
      selection: nextCommentSelection,
      value: editorValue,
    })

    const threadId = uuid()

    operation.create({
      type: 'field',
      contentSnapshot: fragment,
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      parentCommentId: undefined,
      reactions: EMPTY_ARRAY,
      selection: textSelection,
      status: 'open',
      threadId,
    })

    // Open the inspector when a new comment is added
    onCommentsOpen?.()

    // Set the status to 'open' so that the comment is visible
    if (status === 'resolved') {
      setStatus('open')
    }

    // Set the selected path to the new comment
    setSelectedPath({
      fieldPath: stringFieldPath,
      threadId,
      origin: 'form',
    })

    // Scroll to the comment
    scrollToGroup(threadId)

    resetStates()
  }, [
    nextCommentSelection,
    getFragment,
    operation,
    stringFieldPath,
    nextCommentValue,
    onCommentsOpen,
    status,
    setSelectedPath,
    scrollToGroup,
    resetStates,
    setStatus,
  ])

  const handleDecoratorClick = useCallback(
    (commentId: string) => {
      const comment = getComment(commentId)
      if (!comment) return

      setSelectedPath({
        fieldPath: comment.target.path?.field || '',
        threadId: comment.threadId,
        origin: 'form',
      })

      onCommentsOpen?.()

      scrollToComment(comment._id)
    },
    [getComment, onCommentsOpen, scrollToComment, setSelectedPath],
  )

  const blurred = useRef<boolean>(false)

  const handleSelectionChange = useCallback(
    (selection: EditorSelection | null) => {
      const isRangeSelected = selection?.anchor.offset !== selection?.focus.offset

      const fragment = getFragment()
      const isValidSelection = fragment?.every(isPortableTextTextBlock)

      if (!isValidSelection || !isRangeSelected) {
        setCanSubmit(false)
        return
      }
      /**
       * When the portable text editor loses focus we will save the blurred.current to true.
       * Later, when it restores focus the editor will emit a selection change event, but we don't want to immediately show the comment input
       * instead, we want to wait until the user selects a new range.
       */
      if (blurred.current) {
        blurred.current = false
        return
      }
      // If the mouse is not down, we want to set the current selection rect
      // when the selection changes. Otherwise, we want to wait until the mouse
      // is up to set the current selection rect (see `handleMouseUp`).
      if (!mouseDownRef.current) {
        handleSetCurrentSelectionRect()
      }

      setCurrentSelection(selection)
      setCanSubmit(true)
    },
    [getFragment, handleSetCurrentSelectionRect],
  )

  const debounceSelectionChange = useMemo(
    () => debounce(handleSelectionChange, 200),
    [handleSelectionChange],
  )

  const handleMouseDown = useCallback(() => {
    mouseDownRef.current = true
  }, [])

  const handleMouseUp = useCallback(() => {
    mouseDownRef.current = false

    // When the mouse is up, we want to set the current selection rect.
    handleSetCurrentSelectionRect()
  }, [handleSetCurrentSelectionRect])

  const handleRangeDecorationMoved = useCallback((details: RangeDecorationOnMovedDetails) => {
    const {rangeDecoration, newSelection} = details

    const commentId = rangeDecoration.payload?.commentId as undefined | string

    // Update the range decoration with the new selection.
    setAddedCommentsDecorations((prev) => {
      const next = prev.map((p) => {
        if (p.payload?.commentId === commentId) {
          const nextDecoration: RangeDecoration = {
            ...rangeDecoration,
            selection: newSelection,
            payload: {...rangeDecoration.payload, dirty: true},
          }
          return nextDecoration
        }
        return p
      })
      return next
    })
  }, [])

  const updateCommentRange = useCallback(() => {
    const decoratorsToUpdate = addedCommentsDecorations.filter(
      (decorator) => decorator.payload?.dirty,
    )
    if (decoratorsToUpdate.length === 0) return

    decoratorsToUpdate.forEach((decorator) => {
      const commentId = decorator.payload?.commentId as undefined | string
      const comment = getComment(commentId || '')

      // If the comment no longer exists, remove the range decoration.
      if (!comment) {
        return
      }

      // The below code will update the comment object to reflect the new selection
      if (!editorRef.current) return
      const editorValue = PortableTextEditor.getValue(editorRef.current) || EMPTY_ARRAY

      const [updatedDecoration] = buildRangeDecorationSelectionsFromComments({
        comments: [comment],
        value: editorValue,
      })

      const nextRange = updatedDecoration?.range ? [updatedDecoration.range] : EMPTY_ARRAY

      const nextValue: CommentsTextSelectionItem[] = updatedDecoration
        ? [
            ...(comment.target.path?.selection?.value
              .filter((r) => r._key !== nextRange[0]?._key)
              .concat(nextRange)
              .flat() || EMPTY_ARRAY),
          ]
        : EMPTY_ARRAY

      const nextComment: CommentUpdatePayload = {
        target: {
          ...comment.target,
          path: {
            ...(comment.target?.path || {}),
            field: comment.target.path?.field || '',
            selection: {
              type: 'text',
              value: nextValue,
            },
          },
        },
      }

      operation.update(comment._id, nextComment)
    })

    // Mark the range decorations as not dirty
    setAddedCommentsDecorations((prev) => {
      const next = prev.map((p) => {
        const isDirty = decoratorsToUpdate.find(
          (d) => d.payload?.commentId === p.payload?.commentId,
        )?.payload?.dirty

        if (isDirty) {
          const nextDecoration: RangeDecoration = {
            ...p,
            payload: {...p.payload, dirty: false},
          }
          return nextDecoration
        }
        return p
      })
      return next.filter((p) => p.selection !== null)
    })
  }, [addedCommentsDecorations, getComment, operation])

  const handleBuildRangeDecorations = useCallback(
    (commentsToDecorate: CommentDocument[]) => {
      if (!editorRef.current) return EMPTY_ARRAY
      const editorValue = PortableTextEditor.getValue(editorRef.current) || EMPTY_ARRAY

      return buildCommentRangeDecorations({
        comments: commentsToDecorate,
        currentHoveredCommentId,
        onDecorationClick: handleDecoratorClick,
        onDecorationHoverEnd: setCurrentHoveredCommentId,
        onDecorationHoverStart: setCurrentHoveredCommentId,
        onDecorationMoved: handleRangeDecorationMoved,
        selectedThreadId: selectedPath?.threadId || null,
        value: editorValue,
      })
    },
    [
      currentHoveredCommentId,
      handleDecoratorClick,
      handleRangeDecorationMoved,
      selectedPath?.threadId,
    ],
  )

  const onEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'mutation') {
        updateCommentRange()
      }
      if (change.type === 'blur') {
        blurred.current = true
      }
      if (change.type === 'selection') {
        debounceSelectionChange(change.selection)
      }
    },
    [debounceSelectionChange, updateCommentRange],
  )

  // The range decoration for the comment input. This is used to position the
  // comment input popover on the current selection and to highlight the
  // selected text.
  const authoringDecoration = useMemo((): RangeDecoration | null => {
    if (!nextCommentSelection) return null

    return {
      component: ({children}) => (
        <CommentInlineHighlightSpan isAuthoring ref={setAuthoringDecorationElement}>
          {children}
        </CommentInlineHighlightSpan>
      ),
      selection: nextCommentSelection,
    }
  }, [nextCommentSelection])

  // All the range decorations
  const rangeDecorations = useMemo((): RangeDecoration[] => {
    return [
      // Existing range decorations
      ...(props?.rangeDecorations || EMPTY_ARRAY),
      // The range decoration when adding a comment
      ...(authoringDecoration ? [authoringDecoration] : EMPTY_ARRAY),
      // The range decorations for existing comments
      ...addedCommentsDecorations,
    ]
  }, [addedCommentsDecorations, authoringDecoration, props?.rangeDecorations])

  const currentSelectionIsOverlapping = useMemo(() => {
    if (!currentSelection || addedCommentsDecorations.length === 0) return false

    return addedCommentsDecorations.some((d) => {
      if (!editorRef.current) return false

      const testA = PortableTextEditor.isSelectionsOverlapping(
        editorRef.current,
        currentSelection,
        d.selection,
      )

      const testB = PortableTextEditor.isSelectionsOverlapping(
        editorRef.current,
        d.selection,
        currentSelection,
      )

      return testA || testB
    })
  }, [addedCommentsDecorations, currentSelection])

  // The scroll element used to update the reference element for the
  // popover on scroll.
  const scrollElement = isFullScreen
    ? document.body
    : portal.elements?.documentScrollElement || document.body

  // The boundary element used to position the popover properly
  // inside the editor.
  const boundaryElement = isFullScreen
    ? portal.elements?.documentScrollElement || document.body
    : rootElement

  const popoverAuthoringReferenceElement = useAuthoringReferenceElement({
    scrollElement,
    disabled: !nextCommentSelection || !authoringDecorationElement,
    selector: '[data-inline-comment-state="authoring"]',
  })

  const selectionReferenceElement = useMemo(() => {
    if (!currentSelectionRect) return null

    return {
      getBoundingClientRect: () => currentSelectionRect,
    } as HTMLElement
  }, [currentSelectionRect])

  // This effect is needed to update the reference element for the popover
  // when the current selection changes so that it is always positioned
  // on the current selection.
  useEffect(() => {
    if (!currentSelection) return undefined
    scrollElement?.addEventListener('wheel', handleSetCurrentSelectionRect)

    return () => {
      scrollElement?.removeEventListener('wheel', handleSetCurrentSelectionRect)
    }
  }, [currentSelection, scrollElement, handleSetCurrentSelectionRect])

  // This is effect is needed to handle remote changes to the comments.
  // That is, when another user adds, updates or deletes a comment, we need
  // to update the range decorations to reflect these changes in the UI.
  useEffect(() => {
    const nextDecorations = handleBuildRangeDecorations(textComments)

    // The `dirty` flag is used to keep track of range decorations that
    // have been moved. When a range decoration is moved, we need to update
    // the comment document. However, when receiving updates from the server,
    // the `dirty` flag will be removed. Therefore, we need to make sure
    // that the `dirty` flag is preserved so that we can update the comment.
    setAddedCommentsDecorations((current) => {
      return nextDecorations.map((nextDecoration) => {
        const prevDecoration = current.find(
          (p) => p.payload?.commentId === nextDecoration.payload?.commentId,
        )

        if (prevDecoration?.payload?.dirty) {
          return {
            ...nextDecoration,
            payload: {...nextDecoration.payload, dirty: prevDecoration.payload.dirty},
          }
        }

        return nextDecoration
      })
    })
  }, [handleBuildRangeDecorations, textComments])

  const showFloatingButton = Boolean(
    currentSelection && canSubmit && selectionReferenceElement && !mouseDownRef.current,
  )
  const showFloatingInput = Boolean(nextCommentSelection && popoverAuthoringReferenceElement)

  return (
    <>
      <BoundaryElementProvider element={boundaryElement}>
        <AnimatePresence>
          {showFloatingInput && currentUser && (
            <InlineCommentInputPopover
              currentUser={currentUser}
              mentionOptions={mentionOptions}
              onChange={setNextCommentValue}
              onClickOutside={resetStates}
              onDiscardConfirm={handleCommentDiscardConfirm}
              onSubmit={handleSubmit}
              referenceElement={popoverAuthoringReferenceElement}
              value={nextCommentValue}
            />
          )}

          {showFloatingButton && !showFloatingInput && (
            <FloatingButtonPopover
              disabled={currentSelectionIsOverlapping}
              onClick={handleSelectCurrentSelection}
              onClickOutside={resetStates}
              referenceElement={selectionReferenceElement}
            />
          )}
        </AnimatePresence>
      </BoundaryElementProvider>

      <Stack ref={setRootElement} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
        {props.renderDefault({
          ...props,
          onEditorChange,
          editorRef,
          rangeDecorations,
          onFullScreenChange: setIsFullScreen,
        })}
      </Stack>
    </>
  )
})
