import {
  type EditorChange,
  type EditorSelection,
  PortableTextEditor,
  type RangeDecoration,
} from '@sanity/portable-text-editor'
import {BoundaryElementProvider, usePortal} from '@sanity/ui'
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
  CommentInlineHighlightSpan,
  type CommentMessage,
  type CommentUpdatePayload,
  currentSelectionIsOverlappingWithComment,
  hasCommentMessageValue,
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

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [addedCommentsDecorators, setAddedCommentsDecorators] =
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
      .filter((c) => c.selection?.type === 'text')
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
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      // This is a new comment, so we don't have a parent comment id
      parentCommentId: undefined,
      selection: textSelection,
      status: 'open',
      // This is a new comment, so we need to generate a new thread id
      threadId,
      reactions: EMPTY_ARRAY,
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

  const handleBuildAddedRangeDecorators = useCallback(() => {
    if (!editorRef.current) return
    // We need to use the value from the editor state to build the range decorators
    // instead of `props.value` as that value is debounced – and we want to immediately
    // update the range decorators when the user is typing and not wait for the debounce
    // to finish.
    const editorStateValue = PortableTextEditor.getValue(editorRef.current)

    const decorators = buildRangeDecorations({
      comments: textComments,
      currentHoveredCommentId,
      onDecoratorClick: handleDecoratorClick,
      onDecoratorHoverEnd: setCurrentHoveredCommentId,
      onDecoratorHoverStart: setCurrentHoveredCommentId,
      selectedThreadId: selectedPath?.threadId || null,
      value: editorStateValue,
    })

    setAddedCommentsDecorators(decorators)
  }, [currentHoveredCommentId, handleDecoratorClick, selectedPath?.threadId, textComments])

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
      if (change.type === 'rangeDecorationMoved') {
        handleBuildAddedRangeDecorators()
        const commentId = change.rangeDecoration.payload?.commentId as undefined | string
        let currentBlockKey: string | undefined
        let previousBlockKey: string | undefined
        let newRange: {text: string; _key: string} | undefined

        if (
          change.newRangeSelection?.focus.path[0] &&
          isKeySegment(change.newRangeSelection.focus.path[0]) &&
          change.rangeDecoration.selection?.focus.path[0] &&
          isKeySegment(change.rangeDecoration.selection?.focus.path[0])
        ) {
          previousBlockKey = change.rangeDecoration.selection?.focus.path[0]?._key
          currentBlockKey = change.newRangeSelection.focus.path[0]._key

          const oldRange = change.rangeDecoration.payload?.range as
            | undefined
            | {_key: string; text: string}

          newRange = {_key: currentBlockKey, text: oldRange?.text || ''}
        }

        const comment = getComment(commentId || '')

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
            throttle: true,
          })
        }
      }
    },
    [
      hasValue,
      debounceSelectionChange,
      resetStates,
      handleBuildAddedRangeDecorators,
      getComment,
      operation,
    ],
  )

  // The range decoration for the comment input. This is used to position the
  // comment input popover on the current selection and to highlight the
  // selected text.
  const authoringDecorator = useMemo((): RangeDecoration | null => {
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
      ...(authoringDecorator ? [authoringDecorator] : EMPTY_ARRAY),
      // The range decorations for existing comments
      ...addedCommentsDecorators,
    ]
  }, [addedCommentsDecorators, authoringDecorator, props?.rangeDecorations])

  const currentSelectionIsOverlapping = useMemo(() => {
    if (!currentSelection || addedCommentsDecorators.length === 0) return false

    const overlaps = currentSelectionIsOverlappingWithComment({
      currentSelection,
      addedCommentsSelections: addedCommentsDecorators.map((decorator) => decorator.selection),
    })

    return overlaps
  }, [addedCommentsDecorators, currentSelection])

  // The scroll element used to update the reference element for the
  // popover on scroll.
  const scrollElement = isFullScreen
    ? document.body
    : portal.elements?.documentScrollElement || document.body

  // The boundary element used to position the popover properly
  // inside the editor.
  const boundaryElement = isFullScreen
    ? portal.elements?.documentScrollElement || document.body
    : document.body // TODO: replace this with appropriate boundary element
  // : props.elementProps.ref.current

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

  useEffect(handleBuildAddedRangeDecorators, [
    handleBuildAddedRangeDecorators,
    // Whenever the comments change, we need to update the range decorators
    // for the comments. Therefore we use the comments as a dependency
    // in the effect.
    textComments,
  ])

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

      {props.renderDefault({
        ...props,
        onEditorChange,
        editorRef,
        rangeDecorations,
        onFullScreenChange: setIsFullScreen,
      })}
    </>
  )
})
