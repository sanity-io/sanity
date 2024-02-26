import {
  type EditorChange,
  type EditorSelection,
  PortableTextEditor,
  type RangeDecoration,
  type RangeDecorationOnMovedDetails,
} from '@sanity/portable-text-editor'
import {BoundaryElementProvider, Stack, usePortal} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {AnimatePresence} from 'framer-motion'
import {debounce} from 'lodash'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  isKeySegment,
  isPortableTextTextBlock,
  type PortableTextInputProps,
  useCurrentUser,
} from 'sanity'

import {
  buildRangeDecorations,
  buildRangeDecorationSelectionsFromComments,
  buildTextSelectionFromFragment,
  type CommentDocument,
  CommentInlineHighlightSpan,
  type CommentMessage,
  type CommentsTextSelectionItem,
  type CommentUpdateOperationOptions,
  type CommentUpdatePayload,
  currentSelectionIsOverlappingWithComment,
  isTextSelectionComment,
  useComments,
  useCommentsEnabled,
  useCommentsScroll,
  useCommentsSelectedPath,
} from '../../../src'
import {getSelectionBoundingRect, useAuthoringReferenceElement} from '../helpers'
import {FloatingButtonPopover} from './FloatingButtonPopover'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'

const EMPTY_ARRAY: [] = []

const UPDATE_OPERATION_OPTIONS: CommentUpdateOperationOptions = {
  throttled: true,
}

const AI_ASSIST_TYPE = 'sanity.assist.instruction.prompt'

export function CommentsPortableTextInput(props: PortableTextInputProps) {
  const {enabled, mode} = useCommentsEnabled()

  // This is a workaround solution to disable comments for the AI assist type.
  // The AI assist uses the official PTE input which is composed from the
  // Form Components API for the authoring of the prompt. Consequently, the input
  // will get the comments functionality as well, which  we don't want.
  // Therefore we disable the comments for the AI assist type.
  const isAiAssist = props.schemaType.name === AI_ASSIST_TYPE

  if (!enabled || mode === 'upsell' || isAiAssist) {
    return props.renderDefault(props)
  }

  return <CommentsPortableTextInputInner {...props} />
}

export const CommentsPortableTextInputInner = React.memo(function CommentsPortableTextInputInner(
  props: PortableTextInputProps,
) {
  const currentUser = useCurrentUser()
  const portal = usePortal()

  const {mentionOptions, comments, operation, onCommentsOpen, getComment} = useComments()
  const {setSelectedPath, selectedPath} = useCommentsSelectedPath()
  const {scrollToComment, scrollToGroup} = useCommentsScroll()

  const editorRef = useRef<PortableTextEditor | null>(null)

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
  }, [])

  // Set the next comment selection to the current selection so that we can
  // render the comment input popover on the current selection using a range decoration.
  const handleSelectCurrentSelection = useCallback(() => {
    setNextCommentSelection(currentSelection)
  }, [currentSelection])

  // Clear the selection and close the popover when discarding the comment
  const handleCommentDiscardConfirm = useCallback(() => {
    resetStates()
  }, [resetStates])

  const textComments = useMemo(() => {
    return comments.data.open
      .filter((comment) => comment.fieldPath === stringFieldPath)
      .filter((c) => isTextSelectionComment(c.parentComment))
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
      contentSnapshot: fragment,
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      parentCommentId: undefined,
      reactions: EMPTY_ARRAY,
      selection: textSelection,
      status: 'open',
      threadId,
    })

    onCommentsOpen?.()

    setSelectedPath({
      fieldPath: stringFieldPath,
      threadId,
      origin: 'form',
    })

    scrollToGroup(threadId)

    resetStates()
  }, [
    resetStates,
    getFragment,
    nextCommentSelection,
    nextCommentValue,
    onCommentsOpen,
    operation,
    scrollToGroup,
    setSelectedPath,
    stringFieldPath,
  ])

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

      scrollToComment(comment._id)
    },
    [getComment, onCommentsOpen, scrollToComment, setSelectedPath],
  )

  const handleSelectionChange = useCallback(
    (selection: EditorSelection | null) => {
      const isRangeSelected = selection?.anchor.offset !== selection?.focus.offset

      const fragment = getFragment()
      const isValidSelection = fragment?.every(isPortableTextTextBlock)

      if (!isValidSelection || !isRangeSelected) {
        setCanSubmit(false)
        return
      }

      handleSetCurrentSelectionRect()
      setCurrentSelection(selection)
      setCanSubmit(true)
    },
    [getFragment, handleSetCurrentSelectionRect],
  )

  const debounceSelectionChange = useMemo(
    () => debounce(handleSelectionChange, 200),
    [handleSelectionChange],
  )

  const handleRangeDecorationMoved = useCallback(
    (details: RangeDecorationOnMovedDetails) => {
      const {rangeDecoration, origin, newSelection} = details

      const commentId = rangeDecoration.payload?.commentId as undefined | string
      const comment = getComment(commentId || '')

      // Remove the range decoration if the comment wasn't found.
      if (!comment) {
        setAddedCommentsDecorations((prev) =>
          // eslint-disable-next-line max-nested-callbacks
          prev.filter((p) => p.payload?.commentId !== commentId),
        )
        return
      }

      if (!editorRef.current) return
      const editorValue = PortableTextEditor.getValue(editorRef.current) || EMPTY_ARRAY

      const [updatedDecoration] = buildRangeDecorationSelectionsFromComments({
        comments: [comment],
        value: editorValue,
      })

      setAddedCommentsDecorations((prev) => {
        // eslint-disable-next-line max-nested-callbacks
        const current = prev.find((p) => p.payload?.commentId === commentId) as RangeDecoration
        if (!current) return prev

        // eslint-disable-next-line max-nested-callbacks
        const next = prev.map((p) => {
          // Update existing range decoration with the new selection
          if (p.payload?.commentId === commentId) {
            const nextDecoration: RangeDecoration = {
              ...current,
              selection: updatedDecoration?.selection,
              payload: {
                ...current.payload,
                range: updatedDecoration?.range,
              },
            }

            return nextDecoration
          }

          return p
        })

        return next
      })

      // The `onDecorationMoved` is called whenever the range decoration is moved.
      // However, we only want to update the comment with the new range if the
      // change is local. That is, if the user is moving the range decoration.
      // Therefore, we check if the change was caused by a "remote" origin
      // (i.e. not by the current user) and  if so, we don't update the comment
      // with the new range.
      if (origin === 'remote') return

      let currentBlockKey = ''
      let previousBlockKey = ''
      let newRange: CommentsTextSelectionItem | undefined

      // TODO: simpliy and add comment that explains this if statement
      if (
        newSelection?.focus.path[0] &&
        isKeySegment(newSelection.focus.path[0]) &&
        rangeDecoration.selection?.focus.path[0] &&
        isKeySegment(rangeDecoration.selection?.focus.path[0])
      ) {
        previousBlockKey = rangeDecoration.selection?.focus.path[0]?._key
        currentBlockKey = newSelection.focus.path[0]._key

        const currentRange = updatedDecoration?.range as CommentsTextSelectionItem | undefined
        const currentRangeText = currentRange?.text || ''

        newRange = {_key: currentBlockKey, text: currentRangeText}
      }

      // TODO: split block needs special treatment like this:
      // if (
      //   newSelection?.focus.path[0] &&
      //   isKeySegment(newSelection.focus.path[0]) &&
      //   rangeDecoration.selection?.focus.path[0] &&
      //   isKeySegment(rangeDecoration.selection?.focus.path[0])
      // ) {
      //   previousBlockKey = rangeDecoration.selection?.focus.path[0]?._key
      //   currentBlockKey = newSelection.focus.path[0]._key
      //   const previousBlock = editorValue.find((b) => b._key === previousBlockKey)

      //   const previousBlockRange = rangeDecoration?.payload?.range as
      //     | CommentsTextSelectionItem
      //     | undefined
      //   const previousBlockChildrenLength =
      //     (previousBlock && toPlainText([previousBlock]).length) || 0

      //   const currentRangeText = previousBlockRange?.text || ''
      //   newRange = {
      //     _key: currentBlockKey,
      //     text: currentRangeText.substring(previousBlockChildrenLength, currentRangeText.length),
      //   }
      // }

      if (newRange) {
        const nextValue: CommentsTextSelectionItem[] = [
          ...(comment.target.path.selection?.value
            // TODO: add a comment that explains this filter
            .filter((r) => r._key !== previousBlockKey && r._key !== currentBlockKey)
            .concat(newRange) || EMPTY_ARRAY),
        ]

        const nextComment: CommentUpdatePayload = {
          target: {
            ...comment.target,
            path: {
              ...comment.target.path,
              selection: {
                type: 'text',
                value: nextValue,
              },
            },
          },
        }

        // Perform the actual update of the comment with the new range.
        // The update is throttled to avoid too many updates in a short time.
        // This is because the `rangeDecorationMoved` event can be triggered
        // on every change in the editor.
        operation.update(comment._id, nextComment, UPDATE_OPERATION_OPTIONS)
      }
    },
    [getComment, operation],
  )

  const handleBuildRangeDecorations = useCallback(
    (commentsToDecorate: CommentDocument[]) => {
      if (!editorRef.current) return EMPTY_ARRAY
      const editorValue = PortableTextEditor.getValue(editorRef.current) || EMPTY_ARRAY

      return buildRangeDecorations({
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
      if (change.type === 'selection') {
        resetStates()
        debounceSelectionChange(change.selection)
      }
    },
    [debounceSelectionChange, resetStates],
  )

  // The range decoration for the comment input. This is used to position the
  // comment input popover on the current selection and to highlight the
  // selected text.
  const authoringDecoration = useMemo((): RangeDecoration | null => {
    if (!nextCommentSelection) return null

    return {
      component: ({children}) => (
        <CommentInlineHighlightSpan isAuthoring>{children}</CommentInlineHighlightSpan>
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

    const overlaps = currentSelectionIsOverlappingWithComment({
      currentSelection,
      addedCommentsSelections: addedCommentsDecorations.map((decorator) => decorator.selection),
    })

    return overlaps
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
    disabled: !nextCommentSelection,
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
    const parentComments = textComments.map((c) => c.parentComment)
    const nextDecorations = handleBuildRangeDecorations(parentComments)

    setAddedCommentsDecorations(nextDecorations)
  }, [handleBuildRangeDecorations, textComments])

  const showFloatingButton = Boolean(currentSelection && canSubmit && selectionReferenceElement)
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

      <Stack ref={setRootElement}>
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
