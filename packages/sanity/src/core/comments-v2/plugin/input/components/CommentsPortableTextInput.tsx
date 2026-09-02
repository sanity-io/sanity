import {
  type EditorSelection,
  type PortableTextBlock,
  PortableTextEditor,
  type RangeDecoration,
  type RangeDecorationOnMovedDetails,
} from '@portabletext/editor'
import {isPortableTextTextBlock, type Path} from '@sanity/types'
import {BoundaryElementProvider, Stack, usePortal} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {dequal as isEqual} from 'dequal/lite'
import debounce from 'lodash-es/debounce.js'
import {AnimatePresence} from 'motion/react'
import {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {useFormValue} from '../../../../form/contexts/FormValue'
import {useFieldActions} from '../../../../form/field/actions/useFieldActions'
import {type EditorChange, type PortableTextInputProps} from '../../../../form/types/inputProps'
import {useCurrentUser} from '../../../../store/user/hooks'
import {CommentInlineHighlightSpan} from '../../../components/pte/CommentInlineHighlightSpan'
import {isTextSelectionComment, parseCommentFieldPath} from '../../../helpers'
import {useComments} from '../../../hooks/useComments'
import {useCommentsEnabled} from '../../../hooks/useCommentsEnabled'
import {useCommentsScroll} from '../../../hooks/useCommentsScroll'
import {useCommentsSelectedPath} from '../../../hooks/useCommentsSelectedPath'
import {useCommentsUpsell} from '../../../hooks/useCommentsUpsell'
import {
  type CommentDocument,
  type CommentFieldCreatePayload,
  type CommentMessage,
  type CommentsTextSelectionItem,
  type CommentsUIMode,
  type CommentUpdatePayload,
} from '../../../types'
import {buildCommentRangeDecorations} from '../../../utils/inline-comments/buildCommentRangeDecorations'
import {buildRangeDecorationSelectionsFromComments} from '../../../utils/inline-comments/buildRangeDecorationSelectionsFromComments'
import {
  buildTextSelectionFromFragment,
  getCommentFieldPath,
} from '../../../utils/inline-comments/buildTextSelectionFromFragment'
import {selectionsToRange, selectionToRange} from '../../../utils/inline-comments/selectionToRange'
import {getSelectionBoundingRect, useAuthoringReferenceElement} from '../helpers'
import {FloatingButtonPopover} from './FloatingButtonPopover'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'

const EMPTY_ARRAY: [] = []

const AI_ASSIST_TYPE = 'sanity.assist.instruction.prompt'

export function CommentsPortableTextInput(props: PortableTextInputProps) {
  const {enabled, mode} = useCommentsEnabled()
  const fieldActions = useFieldActions()

  // This is a workaround solution to disable comments for the AI assist type.
  // The AI assist uses the official PTE input which is composed from the
  // Form Components API for the authoring of the prompt. Consequently, the input
  // will get the comments functionality as well, which  we don't want.
  // Therefore we disable the comments for the AI assist type.
  const isAiAssist = props.schemaType.name === AI_ASSIST_TYPE
  /**
   * Comments can be disabled at field level by passing the `__internal_comments: undefined` prop to the field.
   * Even though is not recommended and tagged as internal, it works for all type of fields.
   * This adds the same ability to disable inline comments in the Portable Text editor.
   */
  const isCommentsEnabledInField = Boolean(fieldActions.__internal_comments)
  if (!enabled || isAiAssist || !isCommentsEnabledInField) {
    return props.renderDefault(props)
  }

  return <CommentsPortableTextInputInner {...props} mode={mode} />
}

const CommentsPortableTextInputInner = memo(function CommentsPortableTextInputInner(
  props: PortableTextInputProps & {mode: CommentsUIMode},
) {
  const {mode, onItemClose, onItemOpen} = props
  const currentUser = useCurrentUser()
  const portal = usePortal()

  const {
    comments,
    versionId,
    getComment,
    mentionOptions,
    onCommentsOpen,
    operation,
    readOnly,
    setStatus,
    status,
  } = useComments()
  const {setSelectedPath, selectedPath} = useCommentsSelectedPath()
  const {scrollToComment, scrollToGroup} = useCommentsScroll()
  const {handleOpenDialog} = useCommentsUpsell()
  const [mousePressed, setMousePressed] = useState<boolean>(false)

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const editorRef = useRef<PortableTextEditor | null>(null)

  // Read through a ref because `useFormValue([])` changes identity on every
  // keystroke: keeping it out of dependency arrays keeps decoration rebuilds
  // keyed on comment changes. The layout effect updates the ref synchronously
  // with the commit, so event handlers never observe a stale value.
  const documentValue = useFormValue([])
  const documentValueRef = useRef(documentValue)
  useLayoutEffect(() => {
    documentValueRef.current = documentValue
  }, [documentValue])

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

  const [fragment, setFragment] = useState<PortableTextBlock[] | null>(null)

  const getFragment = useCallback(() => {
    if (!editorRef.current) return EMPTY_ARRAY
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return PortableTextEditor.getFragment(editorRef.current)
  }, [])

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
    setFragment(null)
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
    const currentFragment = getFragment() || null
    setFragment(currentFragment)
    setNextCommentSelection(currentSelection)
  }, [currentSelection, getFragment, handleOpenDialog, mode])

  // Clear the selection and close the popover when discarding the comment
  const handleCommentDiscardConfirm = useCallback(() => {
    resetStates()
  }, [resetStates])

  const textComments = useMemo(() => {
    return comments.data.open
      .filter((c) => isTextSelectionComment(c.parentComment))
      .filter((c) => {
        // Keep the per-editor work proportional to the editor's own comments.
        const fieldPath = parseCommentFieldPath(c.fieldPath)
        return fieldPath ? PathUtils.startsWith(props.path, fieldPath) : false
      })
      .map((c) => c.parentComment)
  }, [comments.data.open, props.path])

  const handleSubmit = useCallback(
    (nextValue: CommentMessage) => {
      if (!nextCommentSelection || !editorRef.current) return

      const normalizedSelection = nextCommentSelection.backward
        ? {
            backward: false,
            anchor: nextCommentSelection.focus,
            focus: nextCommentSelection.anchor,
          }
        : nextCommentSelection

      const fieldPath = getCommentFieldPath(
        documentValueRef.current,
        props.path,
        normalizedSelection.focus.path,
      )
      if (!fieldPath) return

      const textSelection = buildTextSelectionFromFragment({
        fragment: fragment || EMPTY_ARRAY,
        selection: normalizedSelection,
        documentValue: documentValueRef.current,
        basePath: props.path,
      })

      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      const editorValue = PortableTextEditor.getValue(editorRef.current) || EMPTY_ARRAY
      const range = selectionToRange(normalizedSelection, editorValue) ?? undefined

      const threadId = uuid()

      const payload: Omit<CommentFieldCreatePayload, 'range' | 'fieldValue'> = {
        type: 'field',
        contentSnapshot: fragment,
        fieldPath,
        message: nextValue,
        parentCommentId: undefined,
        reactions: EMPTY_ARRAY,
        selection: textSelection,
        status: 'open',
        threadId,
      }

      void operation.create(range ? {...payload, range, fieldValue: editorValue} : payload)

      // Open the inspector when a new comment is added
      onCommentsOpen?.()

      // Set the status to 'open' so that the comment is visible
      if (status === 'resolved') {
        setStatus('open')
      }

      // Set the selected path to the new comment
      setSelectedPath({
        fieldPath,
        threadId,
        origin: 'form',
      })

      // Scroll to the comment
      scrollToGroup(threadId)

      resetStates()
    },
    [
      nextCommentSelection,
      operation,
      props.path,
      onCommentsOpen,
      status,
      setSelectedPath,
      scrollToGroup,
      resetStates,
      setStatus,
      fragment,
    ],
  )

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

  // Tracks whether an object edit modal inside the editor (e.g. the annotation
  // edit popover) is opening or open. The editor still reports the text as
  // selected while such a modal is opening, and without this guard the
  // floating "Add comment" button would show (or linger) on top of it.
  const objectEditModalOpenRef = useRef<boolean>(false)

  const handleItemOpen = useCallback(
    (itemPath: Path) => {
      objectEditModalOpenRef.current = true
      resetStates()
      onItemOpen(itemPath)
    },
    [onItemOpen, resetStates],
  )

  const handleItemClose = useCallback(() => {
    objectEditModalOpenRef.current = false
    onItemClose()
  }, [onItemClose])

  const handleSelectionChange = useCallback(
    (selection: EditorSelection | null) => {
      // While an object edit modal is opening or open, the selection the
      // editor reports isn't one the user just made — don't offer the
      // floating "Add comment" button for it.
      if (objectEditModalOpenRef.current) {
        setCanSubmit(false)
        return
      }

      const isRangeSelected = selection?.anchor.offset !== selection?.focus.offset

      const selectedFragment = getFragment()
      const isValidSelection = selectedFragment?.every(isPortableTextTextBlock)

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
      if (!mousePressed) {
        handleSetCurrentSelectionRect()
      }

      setCurrentSelection(selection)
      setCanSubmit(true)
    },
    [getFragment, handleSetCurrentSelectionRect, mousePressed],
  )

  const debounceSelectionChange = useDebounceSelectionChange(handleSelectionChange)

  const handleMouseDown = useCallback(() => {
    // A mouse press inside the editor means the selection that follows is
    // made by the user, not restored by a re-focus, so the `blurred` guard
    // in `handleSelectionChange` must not swallow it.
    blurred.current = false
    // It also means any open object edit modal is on its way out (it closes on
    // outside clicks), so stop suppressing the floating "Add comment" button.
    objectEditModalOpenRef.current = false
    startTransition(() => setMousePressed(true))
  }, [])

  const handleMouseUp = useCallback(() => {
    startTransition(() => setMousePressed(false))

    // When the mouse is up, we want to set the current selection rect.
    handleSetCurrentSelectionRect()
  }, [handleSetCurrentSelectionRect])

  const handleRangeDecorationMoved = useCallback((details: RangeDecorationOnMovedDetails) => {
    const {rangeDecoration, newSelection} = details

    const commentId = rangeDecoration.payload?.commentId
    if (typeof commentId !== 'string') return

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
      const commentId = decorator.payload?.commentId
      if (typeof commentId !== 'string') return

      const comment = getComment(commentId)

      // If the comment no longer exists, remove the range decoration.
      if (!comment) {
        return
      }

      // Only persist range updates for comments made on this document. Draft and published
      // share a comment set, so foreign-origin comments (e.g. made on published while viewing
      // draft) can appear here. Rematching them against this editor would rewrite their stored
      // range from the wrong document's text.
      if (comment.target?.sourceDocumentId !== versionId) return

      // Comments on a nested PTE field are decorated here too, since `textComments`
      // matches on path prefix. Their decoration paths start at the container block,
      // not at the text block, so `selectionsToRange` resolves to null and any edit in
      // this editor would de-anchor them. Let the nested editor persist its own ranges.
      const commentFieldPath = parseCommentFieldPath(comment.target.path?.field)
      if (!commentFieldPath || !PathUtils.isEqual(commentFieldPath, props.path)) return

      // The below code will update the comment object to reflect the new selection
      if (!editorRef.current) return
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      const editorValue = PortableTextEditor.getValue(editorRef.current) || EMPTY_ARRAY

      const updatedDecorations = buildRangeDecorationSelectionsFromComments({
        comments: [comment],
        value: editorValue,
        documentValue: documentValueRef.current,
        basePath: props.path,
      })
      const [updatedDecoration] = updatedDecorations

      const nextRange = updatedDecoration?.range ? [updatedDecoration.range] : EMPTY_ARRAY

      const nextValue: CommentsTextSelectionItem[] = updatedDecoration
        ? [
            ...(comment.target.path?.selection?.value
              .filter((r) => r._key !== nextRange[0]?._key)
              .concat(nextRange)
              .flat()
              .sort((a, b) => a._key.localeCompare(b._key)) || EMPTY_ARRAY),
          ]
        : EMPTY_ARRAY

      const nextComment: CommentUpdatePayload = {
        target: {
          ...comment.target,
          path: {
            ...comment.target?.path,
            field: comment.target.path?.field || '',
            selection: {
              type: 'text',
              value: nextValue,
            },
          },
        },
      }

      const hasChanged = !isEqual(comment.target, nextComment.target)

      if (hasChanged) {
        const range = selectionsToRange(
          updatedDecorations.map((d) => d.selection),
          editorValue,
        )

        // API gets range + fieldValue (or null to clear); optimisticUpdate patches the
        // local comment immediately while that request is in flight.
        void operation.updateRange(
          comment._id,
          range
            ? {range, fieldValue: editorValue, optimisticUpdate: nextComment}
            : {range: null, optimisticUpdate: nextComment},
        )
      }
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
  }, [addedCommentsDecorations, versionId, getComment, operation, props.path])

  const handleBuildRangeDecorations = useCallback(
    (commentsToDecorate: CommentDocument[]) => {
      if (!editorRef.current) return EMPTY_ARRAY
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
        documentValue: documentValueRef.current,
        basePath: props.path,
      })
    },
    [
      currentHoveredCommentId,
      handleDecoratorClick,
      handleRangeDecorationMoved,
      props.path,
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
  const rangeDecorations: RangeDecoration[] = [
    // Existing range decorations
    ...(props?.rangeDecorations || EMPTY_ARRAY),
    // The range decoration when adding a comment
    ...(authoringDecoration ? [authoringDecoration] : EMPTY_ARRAY),
    // The range decorations for existing comments
    ...addedCommentsDecorations,
  ]

  const [currentSelectionIsOverlapping, setCurrentSelectionIsOverlapping] = useState<boolean>(false)
  useEffect(() => {
    startTransition(() =>
      setCurrentSelectionIsOverlapping(() => {
        if (!currentSelection || addedCommentsDecorations.length === 0) return false

        return addedCommentsDecorations.some((d) => {
          if (!editorRef.current) return false

          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          const testA = PortableTextEditor.isSelectionsOverlapping(
            editorRef.current,
            currentSelection,
            d.selection,
          )

          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          const testB = PortableTextEditor.isSelectionsOverlapping(
            editorRef.current,
            d.selection,
            currentSelection,
          )

          return testA || testB
        })
      }),
    )
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
    startTransition(() =>
      setAddedCommentsDecorations((current) => {
        return nextDecorations.map((nextDecoration) => {
          const prevDecoration = current.find(
            (p) => p.payload?.commentId === nextDecoration.payload?.commentId,
          )

          if (prevDecoration?.payload?.dirty) {
            return {
              ...nextDecoration,
              payload: {
                ...nextDecoration.payload,
                dirty: prevDecoration.payload.dirty,
              },
            }
          }

          return nextDecoration
        })
      }),
    )
  }, [handleBuildRangeDecorations, textComments])

  const showFloatingButton = Boolean(
    currentSelection && canSubmit && selectionReferenceElement && !mousePressed,
  )
  const showFloatingInput = Boolean(nextCommentSelection && popoverAuthoringReferenceElement)

  return (
    <>
      <BoundaryElementProvider element={boundaryElement}>
        {showFloatingInput && currentUser && !readOnly && (
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
        <AnimatePresence>
          {showFloatingButton && !showFloatingInput && (
            <FloatingButtonPopover
              disabled={currentSelectionIsOverlapping || readOnly}
              onClick={handleSelectCurrentSelection}
              onClickOutside={resetStates}
              referenceElement={selectionReferenceElement}
            />
          )}
        </AnimatePresence>
      </BoundaryElementProvider>

      <Stack ref={setRootElement} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
        <RenderDefaultCommentsPortableTextInputInner
          {...props}
          onEditorChange={onEditorChange}
          onItemClose={handleItemClose}
          onItemOpen={handleItemOpen}
          editorRef={editorRef}
          rangeDecorations={rangeDecorations}
          onFullScreenChange={setIsFullScreen}
        />
      </Stack>
    </>
  )
})

// Workaround for react compiler restrictions on refs triggered by the debounce wrapper
function useDebounceSelectionChange(
  handleSelectionChange: (selection: EditorSelection | null) => void,
) {
  return useMemo(() => debounce(handleSelectionChange, 200), [handleSelectionChange])
}
// Used to workaround restrictions on passing refs to functions in react compiler
function RenderDefaultCommentsPortableTextInputInner(
  props: React.ComponentProps<typeof CommentsPortableTextInputInner>,
) {
  return props.renderDefault(props)
}
