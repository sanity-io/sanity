/* eslint-disable no-restricted-imports */
import {AddCommentIcon, CommentIcon} from '@sanity/icons'
import {Box, Flex, Stack, useClickOutside, Button as SanityUIButton, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import styled, {css} from 'styled-components'
import {hues} from '@sanity/color'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import scrollIntoView from 'scroll-into-view-if-needed'
import {Button, Popover, Tooltip} from '../../../../ui-components'
import {
  CommentInput,
  CommentInputHandle,
  CommentMessage,
  CommentThreadItem,
  hasCommentMessageValue,
  useComments,
  useCommentsEnabled,
  useCommentsSelectedPath,
} from '../../src'
import {useCommentsField} from '../field/CommentsFieldProvider'
import {BlockProps, useCurrentUser} from 'sanity'

const BlockLayoutFlex = styled(Flex)(() => {
  return css`
    position: relative;
    box-sizing: border-box;

    &:after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      right: -35px;
      width: 35px;
      min-height: 25px;
    }
  `
})

const FloatingCommentButtonFlex = styled(Flex)(({theme}) => {
  const {space} = theme.sanity

  return css`
    align-items: flex-start;
    bottom: 1px;
    height: 100%;
    min-height: 25px;
    position: absolute;
    right: -${space[3]}px;
    top: calc(-${space[2]}px + 1px);
    transform: translateX(100%);
    width: max-content;
    z-index: 2;
  `
})

const HighlightOverlay = styled(Box)(({theme}) => {
  const {color, radius, space} = theme.sanity
  const yellow = hues.yellow[color.dark ? 900 : 50].hex

  return css`
    position: absolute;
    top: -${space[2]}px;
    left: -${space[2]}px;
    right: -${space[2]}px;
    bottom: -${space[2]}px;
    border-radius: ${radius[2]}px;
    mix-blend-mode: ${color.dark ? 'screen' : 'multiply'};
    z-index: 1;
    pointer-events: none;

    &[data-state='authoring'] {
      background-color: ${yellow};
    }
  `
})

const ContentStack = styled(Stack)(() => {
  return css`
    width: 320px;
  `
})

function countBlockComments(comments: CommentThreadItem[], blockKey: string) {
  const blockComments = comments
    // Get all comments that are targeting the blocks
    .filter((c) => c.parentComment.target.path.selection?.type === 'blocks')
    // Get all comments that are targeting the current block
    .filter((c) => c.parentComment.target.path.selection?.data.some((d) => d._key === blockKey))

  // Get the number of replies for each comment
  const replies = blockComments.flatMap((c) => c.replies).length

  // Return the number of comments + replies
  return blockComments.length + (replies || 0)
}

export function CommentsBlock(props: BlockProps) {
  const isEnabled = useCommentsEnabled()

  if (!isEnabled) {
    return props.renderDefault(props)
  }

  return <CommentsBlockInner {...props} />
}

function CommentsBlockInner(props: BlockProps) {
  const {mentionOptions, operation, comments, onCommentsOpen} = useComments()
  const {selectedPath, setSelectedPath} = useCommentsSelectedPath()

  const {path} = useCommentsField()
  const currentUser = useCurrentUser()

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage>(null)

  const [open, setOpen] = useState<boolean>(false)
  const [hovered, setHovered] = useState<boolean>(false)

  const commentInputRef = useRef<CommentInputHandle | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const blockKey = props.value._key

  const currentComment = useMemo(() => {
    return comments.data.open.find(
      (c) => c.parentComment.target.path.selection?.data.some((d) => d._key === blockKey),
    )
  }, [blockKey, comments.data.open])

  const count = useMemo(
    () => countBlockComments(comments.data.open, blockKey),
    [comments, blockKey],
  )

  const hasComments = count > 0

  const showCommentButton = useMemo(() => {
    return hovered || open || hasComments
  }, [hasComments, hovered, open])

  const clearHandleClose = useCallback(() => {
    setOpen(false)
    setNextCommentValue(null)
    setHovered(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!nextCommentValue) return

    const threadId = uuid()

    operation.create({
      fieldPath: PathUtils.toString(path),

      // Add the block key to the selection
      selection: {
        type: 'blocks',
        data: [
          {
            _key: blockKey,
          },
        ],
      },
      message: nextCommentValue,
      parentCommentId: undefined,
      reactions: [],
      status: 'open',
      threadId,
    })

    onCommentsOpen?.()
    clearHandleClose()

    setSelectedPath({
      fieldPath: PathUtils.toString(path),
      origin: 'form',
      threadId,
    })
  }, [
    nextCommentValue,
    operation,
    path,
    blockKey,
    onCommentsOpen,
    clearHandleClose,
    setSelectedPath,
  ])

  const handleButtonClickWithComments = useCallback(() => {
    if (!currentComment?.threadId) return

    setSelectedPath({
      fieldPath: PathUtils.toString(path),
      origin: 'form',
      threadId: currentComment?.threadId,
    })

    onCommentsOpen?.()
  }, [currentComment?.threadId, onCommentsOpen, path, setSelectedPath])

  const handleButtonClickWithoutComments = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop propagation to prevent the block from being selected when clicking the button
    e.stopPropagation()
    setOpen((v) => !v)
  }, [])

  const handleMouseOver = useCallback(() => setHovered(true), [])
  const handleMouseOut = useCallback(() => setHovered(false), [])

  const handleDiscardConfirm = useCallback(() => clearHandleClose(), [clearHandleClose])

  const handleDiscardCancel = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
  }, [])

  const handleClickOutsidePopover = useCallback(() => {
    if (!open) return

    if (!hasCommentMessageValue(nextCommentValue)) {
      clearHandleClose()
      return
    }

    commentInputRef.current?.discardDialogController.open()
  }, [clearHandleClose, nextCommentValue, open])

  useClickOutside(handleClickOutsidePopover, [popoverRef.current])

  const commentInputButton = useMemo(() => {
    if (!currentUser) return null

    if (hasComments) {
      return (
        <Tooltip portal placement="top" content={`View comment${count > 1 ? 's' : ''}`}>
          <SanityUIButton
            aria-label="Open comments"
            contentEditable={false}
            mode="bleed"
            onClick={handleButtonClickWithComments}
            padding={2}
            space={2}
          >
            <Flex align="center" gap={2}>
              <Text size={1}>
                <CommentIcon />
              </Text>
              <Text size={0}>{count > 9 ? '9+' : count}</Text>
            </Flex>
          </SanityUIButton>
        </Tooltip>
      )
    }

    return (
      <Popover
        portal
        open={open}
        ref={popoverRef}
        placement="right-start"
        fallbackPlacements={['top-end']}
        content={
          <ContentStack padding={2} sizing="border">
            <CommentInput
              currentUser={currentUser}
              focusLock
              focusOnMount
              mentionOptions={mentionOptions}
              onChange={setNextCommentValue}
              onDiscardCancel={handleDiscardCancel}
              onDiscardConfirm={handleDiscardConfirm}
              onSubmit={handleSubmit}
              ref={commentInputRef}
              value={nextCommentValue}
            />
          </ContentStack>
        }
      >
        <Button
          icon={AddCommentIcon}
          mode="bleed"
          onClick={handleButtonClickWithoutComments}
          selected={open}
          tooltipProps={{content: 'Add block comment', disabled: open}}
        />
      </Popover>
    )
  }, [
    count,
    currentUser,
    handleButtonClickWithComments,
    handleDiscardCancel,
    handleDiscardConfirm,
    handleSubmit,
    handleButtonClickWithoutComments,
    hasComments,
    mentionOptions,
    nextCommentValue,
    open,
  ])

  useEffect(() => {
    if (!props.selected) {
      clearHandleClose()
    }
  }, [clearHandleClose, props.selected])

  const isSelected = useMemo(() => {
    if (selectedPath?.target !== 'block') return false
    if (selectedPath?.threadId !== currentComment?.threadId) return false
    if (selectedPath?.origin === 'form') return false

    return selectedPath?.threadId === currentComment?.threadId
  }, [currentComment?.threadId, selectedPath?.origin, selectedPath?.target, selectedPath?.threadId])

  useEffect(() => {
    if (!rootRef.current || !isSelected) return

    if (props.__unstable_referenceBoundary) {
      scrollIntoView(props.__unstable_referenceBoundary, {
        scrollMode: 'if-needed',
        block: 'center',
        behavior: 'smooth',
      })
    }

    scrollIntoView(rootRef.current, {
      scrollMode: 'if-needed',
      block: 'start',
      behavior: 'smooth',
      boundary: props.__unstable_referenceBoundary,
    })
  }, [isSelected, props.__unstable_referenceBoundary])

  const overlayState = useMemo(() => {
    if (isSelected) return 'authoring'
    if (open) return 'authoring'
    return undefined
  }, [isSelected, open])

  return (
    <BlockLayoutFlex onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut} ref={rootRef}>
      {(showCommentButton || isSelected) && (
        <HighlightOverlay data-state={overlayState} contentEditable={false} />
      )}

      <FloatingCommentButtonFlex contentEditable={false}>
        {showCommentButton && commentInputButton}
      </FloatingCommentButtonFlex>

      {props.renderDefault(props)}
    </BlockLayoutFlex>
  )
}
