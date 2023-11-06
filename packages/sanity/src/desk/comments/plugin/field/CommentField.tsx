import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {PortableTextBlock} from '@sanity/types'
import {Stack, useBoundaryElement} from '@sanity/ui'
import styled, {css} from 'styled-components'
import scrollIntoViewIfNeeded, {Options} from 'scroll-into-view-if-needed'
import {motion, AnimatePresence, Variants} from 'framer-motion'
import {hues} from '@sanity/color'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {useDocumentPane} from '../../../panes/document/useDocumentPane'
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

  const {comments, create, isRunningSetup, mentionOptions, setStatus, status} = useComments()
  const {selectedPath, setSelectedPath} = useCommentsSelectedPath()

  const fieldTitle = useMemo(() => getSchemaTypeTitle(props.schemaType), [props.schemaType])
  const currentComments = useMemo(() => comments.data[status], [comments.data, status])

  const commentsInspectorOpen = useMemo(() => {
    return inspector?.name === COMMENTS_INSPECTOR_NAME
  }, [inspector?.name])

  // Determine if the current field is selected
  const isSelected = useMemo(() => {
    if (!commentsInspectorOpen) return false
    if (selectedPath?.selectedFrom === 'form-field') return false
    return selectedPath?.fieldPath === PathUtils.toString(props.path)
  }, [commentsInspectorOpen, props.path, selectedPath?.fieldPath, selectedPath?.selectedFrom])

  // Get the most recent thread ID for the current field. This is used to query the
  // DOM for the thread in order to be able to scroll to it.
  const currentThreadId = useMemo(() => {
    const pathString = PathUtils.toString(props.path)

    return currentComments.find((comment) => comment.fieldPath === pathString)?.threadId
  }, [currentComments, props.path])

  // Total number of comments for the current field
  const count = useMemo(() => {
    const stringPath = PathUtils.toString(props.path)

    const commentsCount = comments.data.open
      .map((c) => (c.fieldPath === stringPath ? c.commentsCount : 0))
      .reduce((acc, val) => acc + val, 0)

    return commentsCount || 0
  }, [comments.data.open, props.path])

  const hasComments = Boolean(count > 0)

  // A function that scrolls to the thread group with the given ID
  const handleScrollToThread = useCallback(
    (threadId: string) => {
      if (commentsInspectorOpen && shouldScrollToThread && threadId) {
        const node = document.querySelector(`[data-group-id="${threadId}"]`)

        if (node) {
          node.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
          setShouldScrollToThread(false)
        }
      }
    },
    [shouldScrollToThread, commentsInspectorOpen],
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
        target: 'comment-item',
        selectedFrom: 'form-field',
        threadId: currentThreadId,
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
          selectedFrom: 'form-field',
          target: 'comment-item',
          threadId: newThreadId,
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
        block: 'start',
      }) satisfies Options,
    [boundaryElement],
  )

  useEffect(() => {
    // When the field is selected, we want to scroll it into
    // view (if needed) and highlight it.
    if (isSelected && rootElementRef.current) {
      scrollIntoViewIfNeeded(rootElementRef.current, scrollIntoViewIfNeededOpts)
    }
  }, [boundaryElement, isSelected, props.path, scrollIntoViewIfNeededOpts])

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
