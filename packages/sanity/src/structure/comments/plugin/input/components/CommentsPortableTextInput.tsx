import {
  EditorChange,
  EditorSelection,
  PortableTextEditor,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import React, {useState, useRef, useCallback, useMemo} from 'react'
import {debounce} from 'lodash'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {AnimatePresence} from 'framer-motion'
import {useClickOutside} from '@sanity/ui'
import {
  CommentMessage,
  buildRangeDecorators,
  buildTextSelectionFromFragment,
  currentSelectionIsOverlappingWithComment,
  hasCommentMessageValue,
  useComments,
  useCommentsEnabled,
  useCommentsScroll,
  useCommentsSelectedPath,
} from '../../../src'
import {useReferenceElement} from '../helpers'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'
import {HighlightSpan} from './HighlightSpan'
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

export const CommentsPortableTextInputInner = React.memo(function CommentsPortableTextInputInner(
  props: PortableTextInputProps,
) {
  const currentUser = useCurrentUser()
  const {mentionOptions, comments, operation, onCommentsOpen, getComment} = useComments()
  const {setSelectedPath, selectedPath} = useCommentsSelectedPath()
  const {scrollToComment, scrollToGroup} = useCommentsScroll()

  const editorRef = useRef<PortableTextEditor | null>(null)
  const floatingButtonPopoverRef = useRef<HTMLDivElement | null>(null)

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage | null>(null)
  const [currentHoveredCommentId, setCurrentHoveredCommentId] = useState<string | null>(null)
  const [nextCommentSelection, setNextCommentSelection] = useState<EditorSelection | null>(null)
  const [currentSelection, setCurrentSelection] = useState<EditorSelection | null>(null)
  const [canSubmit, setCanSubmit] = useState<boolean>(false)

  const popoverAuthoringReferenceElement = useReferenceElement({
    selector: '[data-inline-comment-state="authoring"]',
    dependency: nextCommentSelection,
  })

  const popoverSelectionReferenceElement = useReferenceElement({
    selector: '[data-ui="InlineCommentSelectionSpan"]',
    dependency: currentSelection,
  })

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const fieldComments = useMemo(() => {
    return comments.data.open?.filter((comment) => comment.fieldPath === stringFieldPath)
  }, [comments, stringFieldPath])

  const textComments = useMemo(() => {
    return fieldComments.filter((c) => c.selection?.type === 'text')
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
  }, [])

  const handleSubmit = useCallback(() => {
    if (!nextCommentSelection || !editorRef.current) return

    const fragment = getFragment() || EMPTY_ARRAY
    const textSelection = buildTextSelectionFromFragment({fragment})
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
    setNextCommentValue(null)
    setNextCommentSelection(null)
    setCurrentSelection(null)
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

  const handleClickOutside = useCallback(() => {
    // If the user clicks outside the comment input with a value
    // we don't want to clear the selection and close the popover
    // but instead display the discard dialog. This is handled in
    // the `InlineCommentInputPopover` component.
    if (hasCommentMessageValue(nextCommentValue)) return

    clearSelection()
  }, [nextCommentValue, clearSelection])

  useClickOutside(handleClickOutside, [
    props.elementProps.ref.current,
    floatingButtonPopoverRef.current,
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
        clearSelection()
        return
      }

      setCurrentSelection(selection)
      setCanSubmit(true)
    },
    [clearSelection, getFragment],
  )

  const debounceSelectionChange = useMemo(
    () => debounce(handleSelectionChange, 200),
    [handleSelectionChange],
  )

  const onEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'selection') {
        const isRangeSelected = change.selection?.anchor.offset !== change.selection?.focus.offset

        // Set the current selection to null if the selection is not a range.
        // This will make sure that the floating button is not displayed immediately
        // and we don't need to wait for the debounce to finish before hiding it.
        if (!isRangeSelected) {
          setCurrentSelection(null)
        }

        debounceSelectionChange(change.selection, isRangeSelected)
      }
    },
    [debounceSelectionChange],
  )

  // The range decorations for existing comments
  const addedCommentsDecorators = useMemo(() => {
    return buildRangeDecorators({
      comments: textComments,
      currentHoveredCommentId,
      onDecoratorClick: handleDecoratorClick,
      onDecoratorHoverEnd: setCurrentHoveredCommentId,
      onDecoratorHoverStart: setCurrentHoveredCommentId,
      selectedThreadId: selectedPath?.threadId || null,
      value: props.value,
    })
  }, [
    textComments,
    currentHoveredCommentId,
    selectedPath?.threadId,
    handleDecoratorClick,
    props.value,
  ])

  // The range decoration for the current selection. This is used to position the
  // floating button popover on the current selection.
  const selectDecorator = useMemo((): RangeDecoration => {
    return {
      component: ({children}) => <span data-ui="InlineCommentSelectionSpan">{children}</span>,
      isRangeInvalid: () => !currentSelection,
      selection: currentSelection,
    }
  }, [currentSelection])

  // The range decoration for the comment input. This is used to position the
  // comment input popover on the current selection and to highlight the
  // selected text.
  const authoringDecorator = useMemo((): RangeDecoration | null => {
    if (!nextCommentSelection) return null

    return {
      component: ({children}) => (
        <HighlightSpan data-inline-comment-state="authoring" style={{userSelect: 'none'}}>
          {children}
        </HighlightSpan>
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
      // The range decoration for the current selection
      ...(selectDecorator ? [selectDecorator] : EMPTY_ARRAY),
      // The range decorations for existing comments
      ...addedCommentsDecorators,
    ]
  }, [addedCommentsDecorators, authoringDecorator, props?.rangeDecorations, selectDecorator])

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
    }),
    [props, onEditorChange, rangeDecorations],
  )

  const showFloatingButton = Boolean(
    currentSelection &&
      canSubmit &&
      popoverSelectionReferenceElement &&
      !currentSelectionIsOverlapping,
  )

  const showFloatingInput = Boolean(
    nextCommentSelection && canSubmit && popoverAuthoringReferenceElement,
  )

  return (
    <>
      <AnimatePresence>
        {showFloatingInput && currentUser && !showFloatingButton && (
          <InlineCommentInputPopover
            currentUser={currentUser}
            mentionOptions={mentionOptions}
            onChange={setNextCommentValue}
            onClickOutside={onClickOutsideCommentInputPopover}
            onDiscardConfirm={handleDiscardConfirm}
            onSubmit={handleSubmit}
            referenceElement={popoverAuthoringReferenceElement}
            value={nextCommentValue}
            key="comment-input-popover"
          />
        )}

        {showFloatingButton && !showFloatingInput && (
          <FloatingButtonPopover
            onClick={handleSelectCurrentSelection}
            referenceElement={popoverSelectionReferenceElement}
            key="comment-input-floating-button"
            ref={floatingButtonPopoverRef}
          />
        )}
      </AnimatePresence>

      {props.renderDefault(inputProps)}
    </>
  )
})
