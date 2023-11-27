import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {PortableTextBlock} from '@sanity/types'
import {Stack, useBoundaryElement} from '@sanity/ui'
import styled, {css} from 'styled-components'
import scrollIntoViewIfNeeded, {Options} from 'scroll-into-view-if-needed'
import {motion, AnimatePresence, Variants} from 'framer-motion'
import {hues} from '@sanity/color'
import {
  useCommentsEnabled,
  useComments,
  CommentCreatePayload,
  useCommentsSelectedPath,
} from '../../src'
import {CommentFieldButton} from './CommentFieldButton'
import {FieldProps, getSchemaTypeTitle, useCurrentUser} from 'sanity'

const HIGHLIGHT_BLOCK_VARIANTS: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
}

export function CommentField(props: FieldProps) {
  const isEnabled = useCommentsEnabled()

  if (isEnabled) return <CommentFieldInner {...props} />

  return props.renderDefault(props)
}

const SCROLL_INTO_VIEW_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'start',
}

const HighlightDiv = styled(motion.div)(({theme}) => {
  const {radius, space, color} = theme.sanity
  const bg = hues.blue[color.dark ? 900 : 50].hex

  return css`
    mix-blend-mode: ${color.dark ? 'screen' : 'multiply'};
    border-radius: ${radius[3]}px;
    top: -${space[2]}px;
    left: -${space[2]}px;
    bottom: -${space[2]}px;
    right: -${space[2]}px;
    pointer-events: none;
    position: absolute;
    z-index: 1;
    width: calc(100% + ${space[2] * 2}px);
    height: calc(100% + ${space[2] * 2}px);
    background-color: ${bg};
  `
})

const FieldStack = styled(Stack)`
  position: relative;
`

function CommentFieldInner(props: FieldProps) {
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<PortableTextBlock[] | null>(null)
  const rootElementRef = useRef<HTMLDivElement | null>(null)

  const {element: boundaryElement} = useBoundaryElement()

  const currentUser = useCurrentUser()

  const {
    comments,
    create,
    isCommentsOpen,
    isRunningSetup,
    mentionOptions,
    onCommentsOpen,
    setStatus,
    status,
  } = useComments()
  const {selectedPath, setSelectedPath} = useCommentsSelectedPath()

  const fieldTitle = useMemo(() => getSchemaTypeTitle(props.schemaType), [props.schemaType])

  const [threadIdToScrollTo, setThreadIdToScrollTo] = useState<string | null>(null)

  // Determine if the current field is selected
  const isSelected = useMemo(() => {
    if (!isCommentsOpen) return false
    if (selectedPath?.origin === 'form' || selectedPath?.origin === 'url') return false
    return selectedPath?.fieldPath === PathUtils.toString(props.path)
  }, [isCommentsOpen, props.path, selectedPath?.fieldPath, selectedPath?.origin])

  // Total number of comments for the current field
  const count = useMemo(() => {
    const stringPath = PathUtils.toString(props.path)

    const commentsCount = comments.data.open
      .map((c) => (c.fieldPath === stringPath ? c.commentsCount : 0))
      .reduce((acc, val) => acc + val, 0)

    return commentsCount || 0
  }, [comments.data.open, props.path])

  const hasComments = Boolean(count > 0)

  const handleSetThreadToScrollTo = useCallback(
    (threadId: string | null) => {
      setSelectedPath({
        threadId,
        origin: 'form',
        fieldPath: PathUtils.toString(props.path),
      })

      setThreadIdToScrollTo(threadId)
    },
    [props.path, setSelectedPath],
  )

  const handleClick = useCallback(() => {
    // When clicking a comment button when the field has comments, we want to:
    if (hasComments) {
      // 1. Change the status to 'open' if it's 'resolved'
      if (status === 'resolved') {
        setStatus('open')
      }

      // 2. Close the comment input if it's open
      setOpen(false)

      // 3. Open the comments inspector
      onCommentsOpen?.()

      // 4. Find the latest comment thread ID for the current field
      const scrollToThreadId = comments.data.open.find(
        (c) => c.fieldPath === PathUtils.toString(props.path),
      )?.threadId

      // 5. Set the thread ID to scroll to in a state and then scroll to it
      // in the `useEffect` below.
      if (scrollToThreadId) {
        handleSetThreadToScrollTo(scrollToThreadId)
      }

      return
    }

    // Else, toggle the comment input open/closed
    setOpen((v) => !v)
  }, [
    hasComments,
    status,
    onCommentsOpen,
    comments.data.open,
    setStatus,
    props.path,
    handleSetThreadToScrollTo,
  ])

  const handleCommentAdd = useCallback(() => {
    if (value) {
      // Since this is a new comment, we generate a new thread ID
      const newThreadId = uuid()

      // Construct the comment payload
      const nextComment: CommentCreatePayload = {
        fieldPath: PathUtils.toString(props.path),
        message: value,
        parentCommentId: undefined,
        status: 'open',
        threadId: newThreadId,
      }

      // Execute the create mutation
      create.execute(nextComment)

      // If a comment is added to a field when viewing resolved comments, we switch
      // to open comments and scroll to the comment that was just added
      // Open the inspector when a new comment is added
      onCommentsOpen?.()

      if (status === 'resolved') {
        // Set the status to 'open' so that the comment is visible
        setStatus('open')
      }

      // Reset the value
      setValue(null)

      // Set the thread ID to scroll to
      handleSetThreadToScrollTo(newThreadId)
    }
  }, [create, handleSetThreadToScrollTo, onCommentsOpen, props.path, setStatus, status, value])

  const handleDiscard = useCallback(() => setValue(null), [])

  const scrollIntoViewIfNeededOpts = useMemo(
    () =>
      ({
        ...SCROLL_INTO_VIEW_OPTIONS,
        boundary: boundaryElement,
        scrollMode: 'if-needed',
        block: 'start',
      }) satisfies Options,
    [boundaryElement],
  )

  // Effect that handles scroll the field into view when it's selected
  useEffect(() => {
    if (isSelected && rootElementRef.current && isCommentsOpen) {
      scrollIntoViewIfNeeded(rootElementRef.current, scrollIntoViewIfNeededOpts)
    }
  }, [boundaryElement, isCommentsOpen, isSelected, props.path, scrollIntoViewIfNeededOpts])

  // // Effect that handles scroll the comment thread into view when it's selected
  useEffect(() => {
    if (isCommentsOpen && threadIdToScrollTo) {
      const node = document.querySelector(`[data-group-id="${threadIdToScrollTo}"]`)

      if (node) {
        node.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
        setThreadIdToScrollTo(null)
      }
    }
  }, [isCommentsOpen, threadIdToScrollTo])

  const internalComments: FieldProps['__internal_comments'] = useMemo(
    () => ({
      button: currentUser && (
        <CommentFieldButton
          count={Number(count)}
          currentUser={currentUser}
          fieldTitle={fieldTitle}
          isRunningSetup={isRunningSetup}
          mentionOptions={mentionOptions}
          onChange={setValue}
          onClick={handleClick}
          onCommentAdd={handleCommentAdd}
          onDiscard={handleDiscard}
          open={open}
          setOpen={setOpen}
          value={value}
        />
      ),
      hasComments,
      isAddingComment: open,
    }),
    [
      currentUser,
      count,
      fieldTitle,
      mentionOptions,
      handleClick,
      handleCommentAdd,
      handleDiscard,
      open,
      value,
      isRunningSetup,
      hasComments,
    ],
  )

  return (
    <FieldStack ref={rootElementRef}>
      {props.renderDefault({
        ...props,
        // eslint-disable-next-line camelcase
        __internal_comments: internalComments,
      })}

      <AnimatePresence>
        {isSelected && (
          <HighlightDiv
            animate="animate"
            exit="exit"
            initial="initial"
            variants={HIGHLIGHT_BLOCK_VARIANTS}
          />
        )}
      </AnimatePresence>
    </FieldStack>
  )
}
