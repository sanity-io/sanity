/* eslint-disable max-statements */
/* eslint-disable max-nested-callbacks */
import {
  type EditorSelection,
  type PortableTextBlock,
  PortableTextEditor,
  type RangeDecoration,
  type RangeDecorationOnMovedDetails,
} from '@portabletext/editor'
import {isKeySegment, isPortableTextTextBlock, type PortableTextTextBlock} from '@sanity/types'
import {BoundaryElementProvider, Stack, usePortal} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {debounce} from 'lodash-es'
import {AnimatePresence} from 'motion/react'
import {memo, startTransition, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {type PortableTextInputProps, useFieldActions, useFormValue} from '../../../../form'
import {type EditorChange} from '../../../../form/inputs/PortableText/PortableTextInput'
import {documentPatch, insert, setIfMissing} from '../../../../form/patch'
import {useCurrentUser} from '../../../../store'
import {useAddonDataset} from '../../../../studio/addonDataset/useAddonDataset'
import {CommentInlineHighlightSpan} from '../../../components'
import {COMMENT_RANGES_FIELD} from '../../../constants'
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
  type CommentRangeEntry,
  type CommentsUIMode,
  type CommentUpdatePayload,
} from '../../../types'
import {
  buildCommentRangeDecorations,
  type BuildCommentRangeDecorationsResult,
  CommentDecorationStateContext,
  type CommentDecorationStateContextValue,
  editorSelectionToRange,
  normalizeCommentRange,
} from '../../../utils'
import {getSelectionBoundingRect, useAuthoringReferenceElement} from '../helpers'
import {FloatingButtonPopover} from './FloatingButtonPopover'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'

const EMPTY_ARRAY: [] = []
const EMPTY_SET: ReadonlySet<string> = new Set()

function getFragmentAtSelection(
  value: PortableTextBlock[],
  selection: EditorSelection,
): PortableTextBlock[] {
  if (!selection) return EMPTY_ARRAY

  const sel = selection.backward ? {anchor: selection.focus, focus: selection.anchor} : selection

  const anchorBlockKey = isKeySegment(sel.anchor.path[0]) ? sel.anchor.path[0]._key : null
  const focusBlockKey = isKeySegment(sel.focus.path[0]) ? sel.focus.path[0]._key : null
  if (!anchorBlockKey || !focusBlockKey) return EMPTY_ARRAY

  const anchorIdx = value.findIndex((b) => b._key === anchorBlockKey)
  const focusIdx = value.findIndex((b) => b._key === focusBlockKey)
  if (anchorIdx === -1 || focusIdx === -1) return EMPTY_ARRAY

  const blocks = value.slice(anchorIdx, focusIdx + 1)

  return blocks.map((block, i): PortableTextBlock => {
    if (!isPortableTextTextBlock(block)) return block

    const isFirst = i === 0
    const isLast = i === blocks.length - 1
    const isSingleBlock = blocks.length === 1

    const anchorSpanKey = isKeySegment(sel.anchor.path[2]) ? sel.anchor.path[2]._key : null
    const focusSpanKey = isKeySegment(sel.focus.path[2]) ? sel.focus.path[2]._key : null

    const trimmedChildren = block.children
      .map((child) => {
        if (typeof child.text !== 'string') return child

        const isAnchorSpan = isFirst && child._key === anchorSpanKey
        const isFocusSpan = isLast && child._key === focusSpanKey

        if (isSingleBlock && isAnchorSpan && isFocusSpan) {
          return {...child, text: child.text.slice(sel.anchor.offset, sel.focus.offset)}
        }
        if (isAnchorSpan) {
          return {...child, text: child.text.slice(sel.anchor.offset)}
        }
        if (isFocusSpan) {
          return {...child, text: child.text.slice(0, sel.focus.offset)}
        }
        return child
      })
      .filter((child) => {
        if (isFirst && anchorSpanKey) {
          const anchorSpanIdx = block.children.findIndex((c) => c._key === anchorSpanKey)
          const childIdx = block.children.findIndex((c) => c._key === child._key)
          if (childIdx < anchorSpanIdx) return false
        }
        if (isLast && focusSpanKey) {
          const focusSpanIdx = block.children.findIndex((c) => c._key === focusSpanKey)
          const childIdx = block.children.findIndex((c) => c._key === child._key)
          if (childIdx > focusSpanIdx) return false
        }
        return true
      })

    return {...block, children: trimmedChildren} as PortableTextTextBlock
  })
}

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

export const CommentsPortableTextInputInner = memo(function CommentsPortableTextInputInner(
  props: PortableTextInputProps & {mode: CommentsUIMode},
) {
  const {mode} = props
  const currentUser = useCurrentUser()
  const portal = usePortal()

  const {comments, getComment, mentionOptions, onCommentsOpen, operation, setStatus, status} =
    useComments()
  const {error: addonDatasetError} = useAddonDataset()
  const {setSelectedPath, selectedPath} = useCommentsSelectedPath()
  const {scrollToComment, scrollToGroup} = useCommentsScroll()
  const {handleOpenDialog} = useCommentsUpsell()
  const [mousePressed, setMousePressed] = useState<boolean>(false)
  const mousePressedRef = useRef<boolean>(false)
  const [editorReady, setEditorReady] = useState<boolean>(false)

  const editorRef = useRef<PortableTextEditor | null>(null)
  const pendingDetaches = useRef<Set<string>>(new Set())

  const commentRangeEntries = (useFormValue([COMMENT_RANGES_FIELD]) ||
    EMPTY_ARRAY) as CommentRangeEntry[]

  // A reference to the authoring decoration element that highlights the selected text
  // when starting to author a comment.
  const [authoringDecorationElement, setAuthoringDecorationElement] =
    useState<HTMLSpanElement | null>(null)

  const [nextCommentSelection, setNextCommentSelection] = useState<EditorSelection | null>(null)

  const [currentSelection, setCurrentSelection] = useState<EditorSelection | null>(null)
  const [hasSelectionRect, setHasSelectionRect] = useState<boolean>(false)
  const currentSelectionRectRef = useRef<DOMRect | null>(null)

  const [hoveredCommentIds, setHoveredCommentIds] = useState<ReadonlySet<string>>(EMPTY_SET)

  const handleHoverStart = useCallback((commentId: string) => {
    setHoveredCommentIds((prev) => {
      const next = new Set(prev)
      next.add(commentId)
      return next
    })
  }, [])

  const handleHoverEnd = useCallback((commentId: string) => {
    setHoveredCommentIds((prev) => {
      const next = new Set(prev)
      next.delete(commentId)
      return next
    })
  }, [])

  const [canSubmit, setCanSubmit] = useState<boolean>(false)

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [addedCommentsDecorations, setAddedCommentsDecorations] =
    useState<RangeDecoration[]>(EMPTY_ARRAY)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])
  const [fragment, setFragment] = useState<PortableTextBlock[] | null>(null)

  const getFragment = useCallback(() => {
    if (!editorRef.current) return EMPTY_ARRAY
    return PortableTextEditor.getFragment(editorRef.current)
  }, [])

  const handleSetCurrentSelectionRect = useCallback(() => {
    const rect = getSelectionBoundingRect()
    currentSelectionRectRef.current = rect
    setHasSelectionRect(rect !== null)
  }, [])

  const resetStates = useCallback(() => {
    setCurrentSelection(null)
    currentSelectionRectRef.current = null
    setHasSelectionRect(false)
    setNextCommentSelection(null)
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

  const handleCommentInputUnmount = useCallback(() => {
    if (editorRef.current) {
      PortableTextEditor.focus(editorRef.current)
    }
  }, [])

  const textComments = useMemo(() => {
    return comments.data.open
      .filter((comment) => comment.fieldPath === stringFieldPath)
      .filter((c) => isTextSelectionComment(c.parentComment))
      .map((c) => c.parentComment)
  }, [comments.data.open, stringFieldPath])

  const handleSubmit = useCallback(
    (message: CommentMessage) => {
      if (!nextCommentSelection || !editorRef.current) return

      const editorValue = PortableTextEditor.getValue(editorRef.current)

      if (!editorValue) return

      const commentId = uuid()
      const threadId = uuid()

      const range = editorSelectionToRange(nextCommentSelection, editorValue)

      void operation.create({
        id: commentId,
        type: 'field',
        contentSnapshot: fragment,
        fieldPath: stringFieldPath,
        message,
        parentCommentId: undefined,
        reactions: EMPTY_ARRAY,
        range: range ? commentId : undefined,
        status: 'open',
        threadId,
      })

      // Create the range entry on the main document so the Content Lake
      // knows about this anchor. Uses documentPatch() so the patches
      // bypass the form tree's path prefixing and target the document
      // root directly.
      if (range) {
        const normalized = normalizeCommentRange(range, editorValue)
        props.onChange([
          documentPatch(setIfMissing([], [COMMENT_RANGES_FIELD])),
          documentPatch(
            insert(
              [
                {
                  _key: commentId,
                  field: stringFieldPath,
                  start: {
                    path: `[_key=='${normalized.anchor.blockKey}']`,
                    position: normalized.anchor.offset,
                  },
                  end: {
                    path: `[_key=='${normalized.focus.blockKey}']`,
                    position: normalized.focus.offset,
                  },
                  reference: {
                    _type: 'collaboration.comment',
                    _id: commentId,
                  },
                },
              ],
              'after',
              [COMMENT_RANGES_FIELD, -1],
            ),
          ),
        ])
      }

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
    },
    [
      nextCommentSelection,
      operation,
      stringFieldPath,
      onCommentsOpen,
      status,
      setSelectedPath,
      scrollToGroup,
      resetStates,
      setStatus,
      fragment,
      props,
    ],
  )

  const handleDecoratorClick = useCallback(
    (commentId: string, _allCommentIds: string[]) => {
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
      if (!mousePressedRef.current) {
        handleSetCurrentSelectionRect()
      }

      setCurrentSelection(selection)
      setCanSubmit(true)
    },
    [getFragment, handleSetCurrentSelectionRect],
  )

  const debounceSelectionChange = useDebounceSelectionChange(handleSelectionChange)

  const handleMouseDown = useCallback(() => {
    mousePressedRef.current = true
    setMousePressed(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    mousePressedRef.current = false
    setMousePressed(false)

    // When the mouse is up, we want to set the current selection rect.
    handleSetCurrentSelectionRect()
  }, [handleSetCurrentSelectionRect])

  const debouncedCommentUpdateMap = useRef(new Map<string, ReturnType<typeof debounce>>())

  const debouncedCommentUpdate = useCallback(
    (commentId: string, payload: CommentUpdatePayload) => {
      let fn = debouncedCommentUpdateMap.current.get(commentId)
      if (!fn) {
        fn = debounce((p: CommentUpdatePayload) => {
          void operation.update(commentId, p)
          debouncedCommentUpdateMap.current.delete(commentId)
        }, 1000)
        debouncedCommentUpdateMap.current.set(commentId, fn)
      }
      fn(payload)
    },
    [operation],
  )

  useEffect(
    () => () => {
      for (const fn of debouncedCommentUpdateMap.current.values()) {
        fn.flush()
      }
    },
    [debouncedCommentUpdate],
  )

  // onMoved handles *local* visual state and updates the comment's
  // `contentSnapshot` in the addon dataset. Range positions on the main
  // document are updated transactionally by `shiftsToSystemRangePatches`
  // in PortableTextInput -- we don't duplicate that here.
  const handleRangeDecorationMoved = useCallback(
    (details: RangeDecorationOnMovedDetails) => {
      const {rangeDecoration, newSelection, origin} = details

      const commentId = rangeDecoration.payload?.commentId as undefined | string

      setAddedCommentsDecorations((prev) => {
        return prev.map((p) => {
          if (p.payload?.commentId === commentId) {
            return {
              ...rangeDecoration,
              selection: newSelection,
              payload: rangeDecoration.payload,
            }
          }
          return p
        })
      })

      if (origin === 'local' && commentId && editorRef.current) {
        const comment = getComment(commentId)
        if (!comment) return

        const editorValue = PortableTextEditor.getValue(editorRef.current)
        if (!editorValue) return

        const fragmentForUpdate = getFragmentAtSelection(editorValue, newSelection)
        if (!fragmentForUpdate || fragmentForUpdate.length === 0) return

        debouncedCommentUpdate(comment._id, {
          contentSnapshot: fragmentForUpdate,
        })
      }
    },
    [debouncedCommentUpdate, getComment],
  )

  const EMPTY_BUILD_RESULT: BuildCommentRangeDecorationsResult = useMemo(
    () => ({decorations: EMPTY_ARRAY, detachedCommentIds: EMPTY_ARRAY}),
    [],
  )

  const handleBuildRangeDecorations = useCallback(
    (commentsToDecorate: CommentDocument[]): BuildCommentRangeDecorationsResult => {
      if (!editorRef.current) return EMPTY_BUILD_RESULT
      const editorValue = PortableTextEditor.getValue(editorRef.current) || EMPTY_ARRAY

      return buildCommentRangeDecorations({
        comments: commentsToDecorate,
        commentRangeEntries,
        onDecorationMoved: handleRangeDecorationMoved,
        value: editorValue,
      })
    },
    [EMPTY_BUILD_RESULT, commentRangeEntries, handleRangeDecorationMoved],
  )

  const onEditorChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'ready') {
        setEditorReady(true)
      }
      if (change.type === 'blur') {
        blurred.current = true
      }
      if (change.type === 'selection') {
        debounceSelectionChange(change.selection)
      }
    },
    [debounceSelectionChange],
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

  const rangeDecorations = useMemo(
    (): RangeDecoration[] => [
      ...(props?.rangeDecorations || EMPTY_ARRAY),
      ...(authoringDecoration ? [authoringDecoration] : EMPTY_ARRAY),
      ...addedCommentsDecorations,
    ],
    [props?.rangeDecorations, authoringDecoration, addedCommentsDecorations],
  )

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
    if (!hasSelectionRect) return null

    return {
      getBoundingClientRect: () => currentSelectionRectRef.current!,
    } as HTMLElement
  }, [hasSelectionRect])

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

  // Rebuild decorations when comments or document-level range entries change.
  // Comments whose range collapsed to zero length are detached: their range
  // is removed so they become field-level comments.
  useEffect(() => {
    // The PTE editor initialises with a placeholder block before syncing the
    // real document value.  Running the rebuild against the placeholder would
    // fail to resolve every comment's blockKey, permanently detaching them.
    // Wait for the 'ready' event which signals the actual value is loaded.
    if (!editorReady) return

    const {decorations: nextDecorations, detachedCommentIds} =
      handleBuildRangeDecorations(textComments)

    for (const detachedId of detachedCommentIds) {
      if (pendingDetaches.current.has(detachedId)) continue
      pendingDetaches.current.add(detachedId)

      const comment = getComment(detachedId)
      if (!comment) continue

      void operation.update(detachedId, {
        contentSnapshot: [],
        target: {
          ...comment.target,
          path: {
            field: comment.target.path?.field || '',
          },
        },
      })
    }

    startTransition(() => setAddedCommentsDecorations(nextDecorations))
  }, [editorReady, getComment, handleBuildRangeDecorations, operation, textComments])

  const showFloatingButton = Boolean(
    currentSelection && canSubmit && selectionReferenceElement && !mousePressed,
  )
  const showFloatingInput = Boolean(nextCommentSelection && popoverAuthoringReferenceElement)

  const decorationStateContextValue: CommentDecorationStateContextValue = useMemo(
    () => ({
      hoveredCommentIds,
      selectedThreadId: selectedPath?.threadId || null,
      onClick: handleDecoratorClick,
      onHoverStart: handleHoverStart,
      onHoverEnd: handleHoverEnd,
    }),
    [
      hoveredCommentIds,
      selectedPath?.threadId,
      handleDecoratorClick,
      handleHoverStart,
      handleHoverEnd,
    ],
  )

  return (
    <CommentDecorationStateContext.Provider value={decorationStateContextValue}>
      <BoundaryElementProvider element={boundaryElement}>
        <AnimatePresence>
          {showFloatingInput && currentUser && (
            <InlineCommentInputPopover
              currentUser={currentUser}
              mentionOptions={mentionOptions}
              onClickOutside={resetStates}
              onDiscardConfirm={handleCommentDiscardConfirm}
              onSubmit={handleSubmit}
              onUnmount={handleCommentInputUnmount}
              referenceElement={popoverAuthoringReferenceElement}
            />
          )}

          {showFloatingButton && !showFloatingInput && (
            <FloatingButtonPopover
              disabled={Boolean(addonDatasetError)}
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
          editorRef={editorRef}
          rangeDecorations={rangeDecorations}
          onFullScreenChange={setIsFullScreen}
        />
      </Stack>
    </CommentDecorationStateContext.Provider>
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
