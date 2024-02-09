import {
  EditorChange,
  EditorSelection,
  PortableTextEditor,
  RangeDecoration,
  RangeDecorationMovedChange,
} from '@sanity/portable-text-editor'
import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react'
import {debounce} from 'lodash'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {AnimatePresence} from 'framer-motion'
import {BoundaryElementProvider, useClickOutside, usePortal} from '@sanity/ui'
import {
  CommentMessage,
  CommentInlineHighlightSpan,
  buildRangeDecorators,
  currentSelectionIsOverlappingWithComment,
  hasCommentMessageValue,
  useComments,
  useCommentsEnabled,
  useCommentsScroll,
  useCommentsSelectedPath,
} from '../../../src'
import {ReferenceElementHookOptions, useAuthoringReferenceElement} from '../helpers'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'
import {FloatingButtonPopover} from './FloatingButtonPopover'
import {PortableTextInputProps, isPortableTextTextBlock, useCurrentUser} from 'sanity'

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

function getSelectionBoundingRect(): DOMRect | null {
  const selection = window.getSelection()
  const range = selection?.getRangeAt(0)
  const rect = range?.getBoundingClientRect()

  return rect || null
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
  const [floatingButtonPopoverEl, setFloatingButtonPopoverEl] = useState<HTMLDivElement | null>(
    null,
  )

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage | null>(null)
  const [currentHoveredCommentId, setCurrentHoveredCommentId] = useState<string | null>(null)
  const [nextCommentSelection, setNextCommentSelection] = useState<EditorSelection | null>(null)
  const [currentSelection, setCurrentSelection] = useState<EditorSelection | null>(null)
  const [canSubmit, setCanSubmit] = useState<boolean>(false)

  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const fieldComments = useMemo(() => {
    return comments.data.open?.filter((comment) => comment.fieldPath === stringFieldPath)
  }, [comments, stringFieldPath])

  const rangeComments = useMemo(() => {
    return fieldComments.filter((c) => c.selection?.type === 'range')
  }, [fieldComments])

  const getFragment = useCallback(() => {
    if (!editorRef.current) return EMPTY_ARRAY
    return PortableTextEditor.getFragment(editorRef.current)
  }, [])

  const clearSelection = useCallback(() => {
    setCurrentSelection(null)
    setNextCommentSelection(null)
    setCanSubmit(false)
    setNextCommentValue(null)
    setSelectionRect(null)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!nextCommentSelection || !editorRef.current) return

    const threadId = uuid()

    operation.create({
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      // This is a new comment, so we don't have a parent comment id
      parentCommentId: undefined,
      selection: {type: 'range', value: PortableTextEditor.getSelection(editorRef.current)},
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

    // Reset the states when submitting
    setNextCommentValue(null)
    setNextCommentSelection(null)
    setCurrentSelection(null)
    clearSelection()
  }, [
    clearSelection,
    nextCommentSelection,
    nextCommentValue,
    onCommentsOpen,
    operation,
    scrollToGroup,
    setSelectedPath,
    stringFieldPath,
  ])

  // This will set the current selection state to the current selection ref.
  // When this value is set, the popover with the comment input will open and
  // the comment being added will use the current selection in it's data.
  const handleSelectCurrentSelection = useCallback(() => {
    setCurrentSelection(null)
    setNextCommentSelection(currentSelection)
  }, [currentSelection])

  const handleDiscardConfirm = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  const onClickOutsideCommentInputPopover = useCallback(() => {
    setNextCommentSelection(null)
  }, [])

  const handleSetSelectionRect = useCallback(() => {
    const rect = getSelectionBoundingRect()
    setSelectionRect(rect)
  }, [])

  const handleClickOutside = useCallback(() => {
    // If the user clicks outside the comment input with a value
    // we don't want to clear the selection and close the popover
    // but instead display the discard dialog. This is handled in
    // the `InlineCommentInputPopover` component.
    if (hasCommentMessageValue(nextCommentValue)) return

    clearSelection()
  }, [nextCommentValue, clearSelection])

  useClickOutside(handleClickOutside, [floatingButtonPopoverEl, props.elementProps.ref.current])

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
        clearSelection()
        return
      }

      handleSetSelectionRect()
      setCurrentSelection(selection)
      setCanSubmit(true)
    },
    [clearSelection, getFragment, handleSetSelectionRect],
  )

  const debounceSelectionChange = useMemo(
    () => debounce(handleSelectionChange, 200),
    [handleSelectionChange],
  )

  const handleRangeDecorationMoveChange = useCallback(
    (change: RangeDecorationMovedChange) => {
      const commentId = (change.rangeDecoration.payload?.commentId || '') as string
      const comment = getComment(commentId)

      if (comment && comment.target.path.selection?.type === 'range') {
        operation.update(commentId, {
          target: {
            ...comment.target,
            path: {
              ...comment.target.path,
              selection: {
                type: 'range',
                value: change.newRangeSelection,
              },
            },
          },
        })
      }
    },
    [getComment, operation],
  )

  const onEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'rangeDecorationMoved') {
        handleRangeDecorationMoveChange(change)
      }

      if (change.type === 'selection') {
        const isRangeSelected = change.selection?.anchor.offset !== change.selection?.focus.offset

        // Set the current selection to null if the selection is not a range.
        // This will make sure that the floating button is not displayed immediately
        // and we don't need to wait for the debounce to finish before hiding it.
        if (!isRangeSelected) {
          setCurrentSelection(null)
          setSelectionRect(null)
        }

        debounceSelectionChange(change.selection, isRangeSelected)
      }
    },
    [debounceSelectionChange, handleRangeDecorationMoveChange],
  )

  // The range decorations for existing comments
  const addedCommentsDecorators = useMemo(() => {
    return buildRangeDecorators({
      comments: rangeComments,
      currentHoveredCommentId,
      onDecoratorClick: handleDecoratorClick,
      onDecoratorHoverEnd: setCurrentHoveredCommentId,
      onDecoratorHoverStart: setCurrentHoveredCommentId,
      selectedThreadId: selectedPath?.threadId || null,
      value: props.value,
    })
  }, [
    rangeComments,
    currentHoveredCommentId,
    selectedPath?.threadId,
    handleDecoratorClick,
    props.value,
  ])

  // The range decoration for the comment input. This is used to position the
  // comment input popover on the current selection and to highlight the
  // selected text.
  const authoringDecorator = useMemo((): RangeDecoration | null => {
    if (!nextCommentSelection) return null

    return {
      component: ({children}) => (
        <CommentInlineHighlightSpan data-inline-comment-state="authoring">
          {children}
        </CommentInlineHighlightSpan>
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
  }, [
    addedCommentsDecorators,
    authoringDecorator,
    props?.rangeDecorations,
    // selectDecorator
  ])

  const currentSelectionIsOverlapping = useMemo(() => {
    if (!currentSelection) return false

    const overlaps = currentSelectionIsOverlappingWithComment({
      currentSelection,
      addedCommentsSelections: addedCommentsDecorators.map((decorator) => decorator.selection),
    })

    return overlaps
  }, [addedCommentsDecorators, currentSelection])

  // The input props for the portable text input
  const inputProps = useMemo(
    (): PortableTextInputProps => ({
      ...props,
      onEditorChange,
      editorRef,
      rangeDecorations,
      onFullScreenChange: setIsFullScreen,
    }),
    [props, onEditorChange, rangeDecorations],
  )

  // The scroll element used to update the reference element for the
  // popover on scroll.
  const scrollElement = useMemo(() => {
    if (!isFullScreen) {
      return portal.elements?.documentScrollElement || document.body
    }

    return document.body
  }, [isFullScreen, portal.elements?.documentScrollElement])

  // The boundary element used to position the popover properly
  // inside the editor.
  const boundaryElement = useMemo(() => {
    if (!isFullScreen) {
      return props.elementProps.ref.current
    }

    return portal.elements?.documentScrollElement || document.body
  }, [isFullScreen, portal.elements?.documentScrollElement, props.elementProps.ref])

  const popoverAuthoringReferenceElement = useAuthoringReferenceElement(
    useMemo(
      (): ReferenceElementHookOptions => ({
        scrollElement,
        disabled: !nextCommentSelection,
        selector: '[data-inline-comment-state="authoring"]',
      }),
      [scrollElement, nextCommentSelection],
    ),
  )

  const selectionReferenceElement = useMemo(() => {
    if (!selectionRect) return null

    return {
      getBoundingClientRect: () => selectionRect,
    } as HTMLElement
  }, [selectionRect])

  useEffect(() => {
    if (!currentSelection) return undefined

    scrollElement?.addEventListener('wheel', handleSetSelectionRect)

    return () => {
      scrollElement?.removeEventListener('wheel', handleSetSelectionRect)
    }
  }, [currentSelection, scrollElement, handleSetSelectionRect])

  const showFloatingButton = Boolean(
    currentSelection && canSubmit && selectionReferenceElement && !currentSelectionIsOverlapping,
  )

  const showFloatingInput = Boolean(
    nextCommentSelection && canSubmit && popoverAuthoringReferenceElement,
  )

  return (
    <>
      <BoundaryElementProvider element={boundaryElement}>
        <AnimatePresence>
          {showFloatingInput && currentUser && (
            <InlineCommentInputPopover
              currentUser={currentUser}
              key="comment-input-popover"
              mentionOptions={mentionOptions}
              onChange={setNextCommentValue}
              onClickOutside={onClickOutsideCommentInputPopover}
              onDiscardConfirm={handleDiscardConfirm}
              onSubmit={handleSubmit}
              referenceElement={popoverAuthoringReferenceElement}
              value={nextCommentValue}
            />
          )}

          {showFloatingButton && (
            <FloatingButtonPopover
              key="comment-input-floating-button"
              onClick={handleSelectCurrentSelection}
              ref={setFloatingButtonPopoverEl}
              referenceElement={selectionReferenceElement}
            />
          )}
        </AnimatePresence>
      </BoundaryElementProvider>

      {props.renderDefault(inputProps)}
    </>
  )
})
