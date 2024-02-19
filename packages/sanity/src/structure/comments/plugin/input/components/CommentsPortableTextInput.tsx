import {
  type EditorChange,
  type EditorSelection,
  PortableTextEditor,
  type RangeDecoration,
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
  buildTextSelectionFromFragment,
  type CommentDocument,
  CommentInlineHighlightSpan,
  type CommentMessage,
  type CommentsTextSelectionItem,
  type CommentUpdatePayload,
  currentSelectionIsOverlappingWithComment,
  hasCommentMessageValue,
  isTextSelectionComment,
  useComments,
  useCommentsEnabled,
  useCommentsScroll,
  useCommentsSelectedPath,
} from '../../../src'
import {getSelectionBoundingRect, isRangeInvalid, useAuthoringReferenceElement} from '../helpers'
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

  const didPatch = useRef<boolean>(false)

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [addedCommentsDecorations, setAddedCommentsDecorations] =
    useState<RangeDecoration[]>(EMPTY_ARRAY)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])
  const hasValue = useMemo(() => hasCommentMessageValue(nextCommentValue), [nextCommentValue])

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
    (selection: EditorSelection | null, isRangeSelected: boolean) => {
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

  const handleBuildAddedRangeDecorations = useCallback(
    (commentsToDecorate: CommentDocument[]) => {
      if (!editorRef.current) return EMPTY_ARRAY
      const editorValue = PortableTextEditor.getValue(editorRef.current) || EMPTY_ARRAY

      return buildRangeDecorations({
        comments: commentsToDecorate,
        currentHoveredCommentId,
        onDecoratorClick: handleDecoratorClick,
        onDecoratorHoverEnd: setCurrentHoveredCommentId,
        onDecoratorHoverStart: setCurrentHoveredCommentId,
        selectedThreadId: selectedPath?.threadId || null,
        value: editorValue,
      })
    },
    [currentHoveredCommentId, handleDecoratorClick, selectedPath?.threadId],
  )

  const onEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'selection') {
        const isRangeSelected = change.selection?.anchor.offset !== change.selection?.focus.offset

        // Set the current selection to null if the selection is not a range.
        // This will make sure that the floating button is not displayed immediately
        // and we don't need to wait for the debounce to finish before hiding it.
        if (!isRangeSelected && !hasValue) {
          resetStates()
          debounceSelectionChange.cancel()
          return
        }

        debounceSelectionChange(change.selection, isRangeSelected)
      }

      // The `rangeDecorationMoved` event triggers when range decorations move, even if
      // not caused by the current user. This means edits by others that move decorations
      // will also trigger this event. While expected, we need to ensure the comment document(s)
      // aren't updated when another user is making changes. Updates to the comment document(s)
      // should only happen when the current user is editing the content.
      // To manage this, we use the `didPatch` ref to track if the event was
      // triggered by the current user by checking the `patch` change type was triggered.
      // The `patch` event only triggers when the current user is making changes to the content.
      // That way, we can ensure the comment document(s) are only updated when the current user
      // is editing the content.
      if (change.type === 'patch') didPatch.current = true
      if (change.type === 'mutation') didPatch.current = false

      if (change.type === 'rangeDecorationMoved') {
        if (!didPatch.current) return

        const commentId = change.rangeDecoration.payload?.commentId as undefined | string
        let currentBlockKey = ''
        let previousBlockKey = ''
        let newRange: CommentsTextSelectionItem | undefined

        const comment = getComment(commentId || '')

        if (!comment) return

        const nextDecorations = handleBuildAddedRangeDecorations([comment])

        if (
          change.newRangeSelection?.focus.path[0] &&
          isKeySegment(change.newRangeSelection.focus.path[0]) &&
          change.rangeDecoration.selection?.focus.path[0] &&
          isKeySegment(change.rangeDecoration.selection?.focus.path[0])
        ) {
          previousBlockKey = change.rangeDecoration.selection?.focus.path[0]?._key
          currentBlockKey = change.newRangeSelection.focus.path[0]._key

          const currentRange = nextDecorations.find((d) => d.payload?.commentId === commentId)
            ?.payload?.range as CommentsTextSelectionItem | undefined

          const currentRangeText = currentRange?.text || ''

          newRange = {_key: currentBlockKey, text: currentRangeText}
        }

        if (comment && newRange) {
          const nextComment: CommentUpdatePayload = {
            target: {
              ...comment.target,
              path: {
                ...comment.target.path,
                selection: {
                  type: 'text',
                  value: [
                    ...(comment.target.path.selection?.value
                      .filter((r) => r._key !== previousBlockKey && r._key !== currentBlockKey)
                      .concat(newRange) || EMPTY_ARRAY),
                  ],
                },
              },
            },
          }

          operation.update(comment._id, nextComment, {
            throttled: true,
          })
        }
      }
    },
    [
      hasValue,
      debounceSelectionChange,
      resetStates,
      handleBuildAddedRangeDecorations,
      getComment,
      operation,
    ],
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
      isRangeInvalid,
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

  useEffect(() => {
    if (!currentSelection) return undefined
    scrollElement?.addEventListener('wheel', handleSetCurrentSelectionRect)

    return () => {
      scrollElement?.removeEventListener('wheel', handleSetCurrentSelectionRect)
    }
  }, [currentSelection, scrollElement, handleSetCurrentSelectionRect])

  useEffect(() => {
    const parentComments = textComments.map((c) => c.parentComment)
    const nextDecorations = handleBuildAddedRangeDecorations(parentComments)

    setAddedCommentsDecorations(nextDecorations)
  }, [handleBuildAddedRangeDecorations, textComments])

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
