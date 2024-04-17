import {hues} from '@sanity/color'
import {type PortableTextBlock} from '@sanity/types'
import {Stack, useBoundaryElement} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {useCallback, useMemo, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {type FieldProps} from '../../../form'
import {getSchemaTypeTitle} from '../../../schema'
import {useCurrentUser} from '../../../store'
import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {isTextSelectionComment} from '../../helpers'
import {
  applyCommentsFieldAttr,
  useComments,
  useCommentsAuthoringPath,
  useCommentsEnabled,
  useCommentsScroll,
  useCommentsSelectedPath,
  useCommentsUpsell,
} from '../../hooks'
import {type CommentCreatePayload, type CommentMessage, type CommentsUIMode} from '../../types'
import {CommentsFieldButton} from './CommentsFieldButton'

// When the form is temporarily set to `readOnly` while reconnecting, the form
// will be re-rendered and any comment that is being authored will be lost.
// To avoid this, we cache the comment message in a map and restore it when the
// field is re-rendered.
const messageCache = new Map<string, CommentMessage>()

const EMPTY_ARRAY: [] = []

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

export function CommentsField(props: FieldProps) {
  const {enabled, mode} = useCommentsEnabled()

  if (!enabled) {
    return props.renderDefault(props)
  }

  return <CommentFieldInner {...props} mode={mode} />
}

const HighlightDiv = styled(motion.div)(({theme}) => {
  const {radius, space, color} = theme.sanity
  const bg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][color.dark ? 900 : 50].hex

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

function CommentFieldInner(
  props: FieldProps & {
    mode: CommentsUIMode
  },
) {
  const {mode} = props

  const currentUser = useCurrentUser()
  const {element: boundaryElement} = useBoundaryElement()

  const rootRef = useRef<HTMLDivElement | null>(null)

  const {
    comments,
    isCommentsOpen,
    isCreatingDataset,
    mentionOptions,
    onCommentsOpen,
    operation,
    setStatus,
    status,
  } = useComments()
  const {upsellData, handleOpenDialog} = useCommentsUpsell()
  const {selectedPath, setSelectedPath} = useCommentsSelectedPath()
  const {authoringPath, setAuthoringPath} = useCommentsAuthoringPath()
  const {scrollToGroup} = useCommentsScroll({
    boundaryElement,
  })

  const fieldTitle = useMemo(() => getSchemaTypeTitle(props.schemaType), [props.schemaType])
  const stringPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  // Use the cached value if it exists as the initial value
  const cachedValue = messageCache.get(stringPath) || null

  const [value, setValue] = useState<PortableTextBlock[] | null>(cachedValue)

  // If the path of the field matches the authoring path, the comment input should be open.
  const isOpen = useMemo(() => authoringPath === stringPath, [authoringPath, stringPath])

  // Determine if the current field is selected
  const isSelected = useMemo(() => {
    if (!isCommentsOpen) return false
    if (selectedPath?.origin === 'form' || selectedPath?.origin === 'url') return false
    return selectedPath?.fieldPath === stringPath
  }, [isCommentsOpen, selectedPath?.fieldPath, selectedPath?.origin, stringPath])

  const isInlineCommentThread = useMemo(() => {
    return comments.data.open
      .filter((c) => c.threadId === selectedPath?.threadId)
      .some((x) => isTextSelectionComment(x.parentComment))
  }, [comments.data.open, selectedPath?.threadId])

  // Total number of comments for the current field
  const count = useMemo(() => {
    const commentsCount = comments.data.open
      .map((c) => (c.fieldPath === stringPath ? c.commentsCount : 0))
      .reduce((acc, val) => acc + val, 0)

    return commentsCount || 0
  }, [comments.data.open, stringPath])

  const hasComments = Boolean(count > 0)

  const resetMessageValue = useCallback(() => {
    // Reset the value and remove the message from the cache
    setValue(null)
    messageCache.delete(stringPath)
  }, [stringPath])

  const handleClick = useCallback(() => {
    // When clicking a comment button when the field has comments, we want to:
    if (hasComments) {
      // 1. Change the status to 'open' if it's 'resolved'
      if (status === 'resolved') {
        setStatus('open')
      }

      // 2. Ensure that the authoring path is reset when clicking
      //    the comment button when the field has comments.
      setAuthoringPath(null)

      // 3. Open the comments inspector
      onCommentsOpen?.()

      // 4. Find the latest comment thread ID for the current field
      const scrollToThreadId = comments.data.open.find(
        (c) => c.fieldPath === PathUtils.toString(props.path),
      )?.threadId

      // 5. Set the latest thread ID as the selected thread ID
      //    and scroll to the it.
      if (scrollToThreadId) {
        // handleSetThreadToScrollTo(scrollToThreadId)
        setSelectedPath({
          threadId: scrollToThreadId,
          origin: 'form',
          fieldPath: PathUtils.toString(props.path),
        })

        scrollToGroup(scrollToThreadId)
      }

      return
    }

    if (mode === 'upsell') {
      if (upsellData) {
        handleOpenDialog('field_action')
      } else {
        // Open the comments inspector
        onCommentsOpen?.()
      }
      return
    }

    // If the field is open (i.e. the authoring path is set to the current field)
    // we close the field by resetting the authoring path. If the field is not open,
    // we set the authoring path to the current field so that the comment form is opened.
    setAuthoringPath(isOpen ? null : stringPath)
  }, [
    comments.data.open,
    handleOpenDialog,
    hasComments,
    isOpen,
    mode,
    onCommentsOpen,
    props.path,
    scrollToGroup,
    setAuthoringPath,
    setSelectedPath,
    setStatus,
    status,
    stringPath,
    upsellData,
  ])

  const handleCommentAdd = useCallback(() => {
    if (value) {
      // Since this is a new comment, we generate a new thread ID
      const newThreadId = uuid()

      // Construct the comment payload
      const nextComment: CommentCreatePayload = {
        type: 'field',
        fieldPath: PathUtils.toString(props.path),
        message: value,
        parentCommentId: undefined,
        status: 'open',
        threadId: newThreadId,
        // New comments have no reactions
        reactions: EMPTY_ARRAY,
      }

      // Execute the create mutation
      operation.create(nextComment)

      // If a comment is added to a field when viewing resolved comments, we switch
      // to open comments and scroll to the comment that was just added
      // Open the inspector when a new comment is added
      onCommentsOpen?.()

      if (status === 'resolved') {
        // Set the status to 'open' so that the comment is visible
        setStatus('open')
      }

      resetMessageValue()

      // Scroll to the thread
      setSelectedPath({
        threadId: newThreadId,
        origin: 'form',
        fieldPath: PathUtils.toString(props.path),
      })

      scrollToGroup(newThreadId)
    }
  }, [
    onCommentsOpen,
    operation,
    props.path,
    resetMessageValue,
    scrollToGroup,
    setSelectedPath,
    setStatus,
    status,
    value,
  ])

  const handleClose = useCallback(() => setAuthoringPath(null), [setAuthoringPath])

  const handleOnChange = useCallback(
    (nextValue: CommentMessage) => {
      setValue(nextValue)
      messageCache.set(stringPath, nextValue)
    },
    [stringPath],
  )

  const internalComments: FieldProps['__internal_comments'] = useMemo(
    () => ({
      button: currentUser && (
        <CommentsFieldButton
          count={Number(count)}
          currentUser={currentUser}
          fieldTitle={fieldTitle}
          isCreatingDataset={isCreatingDataset}
          mentionOptions={mentionOptions}
          onChange={handleOnChange}
          onClick={handleClick}
          onClose={handleClose}
          onCommentAdd={handleCommentAdd}
          onDiscard={resetMessageValue}
          open={isOpen}
          value={value}
        />
      ),
      hasComments,
      isAddingComment: isOpen,
    }),
    [
      currentUser,
      count,
      fieldTitle,
      isCreatingDataset,
      mentionOptions,
      handleOnChange,
      handleClick,
      handleClose,
      handleCommentAdd,
      resetMessageValue,
      isOpen,
      value,
      hasComments,
    ],
  )

  return (
    <FieldStack {...applyCommentsFieldAttr(PathUtils.toString(props.path))} ref={rootRef}>
      {props.renderDefault({
        ...props,
        // eslint-disable-next-line camelcase
        __internal_comments: internalComments,
      })}

      <AnimatePresence>
        {isSelected && !isInlineCommentThread && (
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
