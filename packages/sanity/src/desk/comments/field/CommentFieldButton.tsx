import React, {useCallback, useState} from 'react'
import {
  Box,
  Button,
  Popover,
  Stack,
  Text,
  Tooltip,
  useClickOutside,
  useGlobalKeyDown,
} from '@sanity/ui'
import {CommentIcon} from '@sanity/icons'
import styled, {css} from 'styled-components'
import {COMMENTS_INSPECTOR_NAME} from '../../panes/document/constants'
import {DocumentPaneContextValue} from '../../panes/document/DocumentPaneContext'
import {
  CommentInput,
  CommentMessage,
  CurrentUser,
  PortableTextBlock,
  StatusButton,
  useComments,
  useDidUpdate,
} from 'sanity'

const StyledPopover = styled(Popover)(({theme}) => {
  const {space} = theme.sanity
  const offsetX = space[1] * 2
  const offsetY = -3

  return css`
    /* &[data-placement='right-start'] {
      transform: translate(${offsetX}px, ${offsetY}px);
    }

    &[data-placement='left-start'] {
      transform: translate(-${offsetX}px, ${offsetY}px);
    } */
  `
})

interface CommentFieldButtonProps {
  count: number
  currentUser: CurrentUser
  hasComments: boolean
  onChange: (value: PortableTextBlock[]) => void
  onCommentAdd: () => void
  onDiscardEdit: () => void
  onOpenChange: (open: boolean) => void
  openInspector: DocumentPaneContextValue['openInspector']
  value: CommentMessage
}

export function CommentFieldButton(props: CommentFieldButtonProps) {
  const {
    count,
    currentUser,
    hasComments,
    onChange,
    onCommentAdd,
    onDiscardEdit,
    onOpenChange,
    openInspector,
    value,
  } = props
  const [mentionMenuOpen, setMentionMenuOpen] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)

  const {mentionOptions} = useComments()

  const close = useCallback(() => setOpen(false), [])

  const conditionalClose = useCallback(() => {
    if (mentionMenuOpen) return
    close()
  }, [close, mentionMenuOpen])

  const handleClick = useCallback(() => {
    if (hasComments) {
      openInspector(COMMENTS_INSPECTOR_NAME)
      setOpen(false)
      return
    }

    setOpen((prev) => !prev)
  }, [hasComments, openInspector])

  const handleSubmit = useCallback(() => {
    onCommentAdd()
    close()
  }, [close, onCommentAdd])

  useDidUpdate(open, () => onOpenChange?.(open))

  useClickOutside(conditionalClose, [popoverElement])

  useGlobalKeyDown((event) => {
    if (event.key === 'Escape') {
      conditionalClose()
    }
  })

  if (!hasComments) {
    const content = (
      <Stack
        padding={2}
        space={4}
        style={{
          // todo: improve
          width: 320,
        }}
      >
        <CommentInput
          currentUser={currentUser}
          focusLock
          focusOnMount
          mentionOptions={mentionOptions}
          onChange={onChange}
          onEditDiscard={onDiscardEdit}
          onMentionMenuOpenChange={setMentionMenuOpen}
          onSubmit={handleSubmit}
          value={value}
        />
      </Stack>
    )

    return (
      <StyledPopover
        constrainSize
        content={content}
        fallbackPlacements={['left-start']}
        open={open}
        placement="bottom-end"
        portal
        ref={setPopoverElement}
      >
        <div>
          <Tooltip
            disabled={open}
            portal
            placement="top"
            content={
              <Box padding={2}>
                <Text size={1}>Add comment</Text>
              </Box>
            }
          >
            <Button
              aria-label="Add comment"
              fontSize={1}
              icon={CommentIcon}
              mode="bleed"
              onClick={handleClick}
              padding={2}
              selected={open}
            />
          </Tooltip>
        </div>
      </StyledPopover>
    )
  }

  return (
    <Tooltip
      portal
      placement="top"
      content={
        <Box padding={2}>
          <Text size={1}>
            {count} comment{count > 1 ? 's' : ''}
          </Text>
        </Box>
      }
    >
      <StatusButton
        arial-label="Open comments"
        fontSize={1}
        icon={CommentIcon}
        mode="bleed"
        onClick={handleClick}
        padding={2}
        tone="primary"
      />
    </Tooltip>
  )
}
