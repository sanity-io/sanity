import {
  EditorChange,
  EditorSelection,
  PortableTextEditor,
  RangeDecoration,
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
  buildRangeDecorations,
  buildTextSelectionFromFragment,
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

  const [addedCommentsDecorators, setAddedCommentsDecorators] =
    useState<RangeDecoration[]>(EMPTY_ARRAY)

  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const textComments = useMemo(() => {
    return comments.data.open
      .filter((comment) => comment.fieldPath === stringFieldPath)
      .filter((c) => c.selection?.type === 'text')
  }, [comments.data.open, stringFieldPath])

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

    // Reset the states when submitting
    clearSelection()
  }, [
    clearSelection,
    getFragment,
    nextCommentSelection,
    nextCommentValue,
    onCommentsOpen,
    operation,
    scrollToGroup,
    setSelectedPath,
    stringFieldPath,
  ])

  // Set the next comment selection to the current selection so that we can
  // render the comment input popover on the current selection using a range decoration.
  const handleSelectCurrentSelection = useCallback(() => {
    setCurrentSelection(null)
    setNextCommentSelection(currentSelection)
  }, [currentSelection])

  // Clear the selection and close the popover when discarding the comment
  const handleCommentDiscardConfirm = useCallback(() => {
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
        if (!isRangeSelected) {
          setCurrentSelection(null)
          setSelectionRect(null)
          debounceSelectionChange.cancel()
        }

        debounceSelectionChange(change.selection, isRangeSelected)
      }

      if (change.type === 'patch') {
        handleBuildAddedRangeDecorators()
      }
    },
    [debounceSelectionChange, handleBuildAddedRangeDecorators],
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

  useEffect(() => {
    handleBuildAddedRangeDecorators()

    // Whenever the comments change, we need to update the range decorators
    // for the comments. Therefore we use the comments as a dependency
    // in the effect.
  }, [handleBuildAddedRangeDecorators, textComments])

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
              onDiscardConfirm={handleCommentDiscardConfirm}
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
