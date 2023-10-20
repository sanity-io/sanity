import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {PortableTextBlock} from '@sanity/types'
import {Stack, useBoundaryElement} from '@sanity/ui'
import styled, {css} from 'styled-components'
import scrollIntoViewIfNeeded, {Options} from 'scroll-into-view-if-needed'
import {useInView, motion, AnimatePresence, Variants} from 'framer-motion'
import {hues} from '@sanity/color'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {useDocumentPane} from '../../../panes/document/useDocumentPane'
import {
  useCommentsEnabled,
  useComments,
  useFieldCommentsCount,
  CommentCreatePayload,
} from '../../src'
import {CommentFieldButton} from './CommentFieldButton'
import {FieldProps, useCurrentUser} from 'sanity'

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
  const {documentId, documentType} = useDocumentPane()

  const {isEnabled} = useCommentsEnabled({
    documentId,
    documentType,
  })

  if (!isEnabled) {
    return props.renderDefault(props)
  }

  return <CommentFieldInner {...props} />
}

const SCROLL_INTO_VIEW_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'start',
  inline: 'nearest',
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
  const [shouldScrollToThread, setShouldScrollToThread] = useState<boolean>(false)
  const rootElementRef = useRef<HTMLDivElement | null>(null)

  const {element: boundaryElement} = useBoundaryElement()

  const {openInspector, inspector} = useDocumentPane()
  const currentUser = useCurrentUser()
  const {create, status, setStatus, comments, selectedPath, setSelectedPath} = useComments()
  const count = useFieldCommentsCount(props.path)

  const inView = useInView(rootElementRef)

  const hasComments = Boolean(count > 0)
  const currentComments = useMemo(() => comments.data[status], [comments.data, status])

  const [shouldHighlight, setShouldHighlight] = useState<boolean>(false)

  // Determine if the current field is selected
  const isSelected = useMemo(() => {
    if (selectedPath?.origin === 'field') return false
    return selectedPath?.fieldPath === PathUtils.toString(props.path)
  }, [props.path, selectedPath])

  // Get the most recent thread ID for the current field. This is used to query the
  // DOM for the thread in order to be able to scroll to it.
  const currentThreadId = useMemo(() => {
    const pathString = PathUtils.toString(props.path)

    return currentComments.find((comment) => comment.fieldPath === pathString)?.threadId
  }, [currentComments, props.path])

  // A function that scrolls to the thread with the given ID
  const handleScrollToThread = useCallback(
    (threadId: string) => {
      if (inspector?.name === COMMENTS_INSPECTOR_NAME && shouldScrollToThread && threadId) {
        const node = document.querySelector(`[data-thread-id="${threadId}"]`)

        if (node) {
          node.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
          setShouldScrollToThread(false)
        }
      }
    },
    [inspector, shouldScrollToThread],
  )

  const handleOpenInspector = useCallback(
    () => openInspector(COMMENTS_INSPECTOR_NAME),
    [openInspector],
  )

  const handleClick = useCallback(() => {
    // Since the button in the field only reflects the number of open comments, we
    // want to switch to open comments when the user clicks the button so that
    // the code below can scroll to the thread.
    if (hasComments && status === 'resolved') {
      setStatus('open')
    }

    if (hasComments) {
      setOpen(false)
      openInspector(COMMENTS_INSPECTOR_NAME)
    } else {
      setOpen((v) => !v)
    }

    // If the field has comments, we want to open the inspector, scroll to the comment
    // thread and set the path as selected so that the comment is highlighted  when the
    // user clicks the button.
    if (currentThreadId) {
      setShouldScrollToThread(true)
      handleScrollToThread(currentThreadId)
      setSelectedPath({
        fieldPath: PathUtils.toString(props.path),
        origin: 'field',
      })
    }
  }, [
    hasComments,
    status,
    currentThreadId,
    setStatus,
    openInspector,
    handleScrollToThread,
    setSelectedPath,
    props.path,
  ])

  const handleCommentAdd = useCallback(() => {
    if (value) {
      // Since this is a new comment, we generate a new thread ID
      const newThreadId = uuid()

      // Construct the comment payload
      const nextComment = {
        fieldPath: PathUtils.toString(props.path),
        message: value,
        parentCommentId: undefined,
        status: 'open',
        threadId: newThreadId,
      } satisfies CommentCreatePayload

      // Execute the create mutation
      create.execute(nextComment)

      // If a comment is added to a field when viewing resolved comments, we switch
      // to open comments and scroll to the comment that was just added
      // Open the inspector when a new comment is added
      handleOpenInspector()

      // Set the status to 'open' so that the comment is visible
      setStatus('open')

      // Reset the value
      setValue(null)

      // Enable scrolling to the thread and scroll to the thread.
      // New comments appear at the top, however, the user may have scrolled down
      // to read older comments. Therefore, we scroll up to the thread so that
      // the user can see the new comment.
      requestAnimationFrame(() => {
        // Set the path as selected so that the new comment is highlighted
        setSelectedPath({
          fieldPath: PathUtils.toString(props.path),
          origin: 'field',
        })

        setShouldScrollToThread(true)
        handleScrollToThread(newThreadId)
      })
    }
  }, [
    create,
    handleOpenInspector,
    handleScrollToThread,
    props.path,
    setSelectedPath,
    setStatus,
    value,
  ])

  const handleDiscard = useCallback(() => setValue(null), [])

  useEffect(() => {
    if (currentThreadId) {
      handleScrollToThread(currentThreadId)
    }
  }, [currentThreadId, handleScrollToThread])

  const scrollIntoViewIfNeededOpts = useMemo(
    () =>
      ({
        ...SCROLL_INTO_VIEW_OPTIONS,
        boundary: boundaryElement,
        scrollMode: 'if-needed',
        block: 'center',
      }) satisfies Options,
    [boundaryElement],
  )

  useEffect(() => {
    // When the field is selected, we want to scroll it into
    // view (if needed) and highlight it.
    if (isSelected && rootElementRef.current) {
      scrollIntoViewIfNeeded(rootElementRef.current, scrollIntoViewIfNeededOpts)
    }
  }, [boundaryElement, isSelected, props.path, scrollIntoViewIfNeededOpts, selectedPath])

  useEffect(() => {
    const showHighlight = inView && isSelected

    setShouldHighlight(showHighlight)

    const timer = setTimeout(() => {
      setShouldHighlight(false)
    }, 1200)

    return () => clearTimeout(timer)
  }, [currentComments, inView, isSelected, props.path, selectedPath])

  const internalComments: FieldProps['__internal_comments'] = useMemo(
    () => ({
      button: currentUser && (
        <CommentFieldButton
          count={Number(count)}
          currentUser={currentUser}
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
    [currentUser, count, hasComments, handleClick, handleCommentAdd, handleDiscard, value, open],
  )

  return (
    <FieldStack ref={rootElementRef}>
      <AnimatePresence>
        {shouldHighlight && (
          <HighlightDiv
            animate="animate"
            exit="exit"
            initial="initial"
            variants={HIGHLIGHT_BLOCK_VARIANTS}
          />
        )}
      </AnimatePresence>

      {props.renderDefault({
        ...props,
        // eslint-disable-next-line camelcase
        __internal_comments: internalComments,
      })}
    </FieldStack>
  )
}
