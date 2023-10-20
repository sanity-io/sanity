import {CurrentUser, Path} from '@sanity/types'
import {Button, Flex, Stack} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {uuid} from '@sanity/uuid'
import styled, {css} from 'styled-components'
import * as PathUtils from '@sanity/util/paths'
import {AddCommentIcon} from '../icons'
import {
  CommentMessage,
  CommentCreatePayload,
  MentionOptionsHookValue,
  CommentListBreadcrumbs,
} from '../../types'
import {TextTooltip} from '../TextTooltip'
import {CommentBreadcrumbs} from '../CommentBreadcrumbs'
import {CreateNewThreadInput} from './CreateNewThreadInput'
import {ThreadCard} from './styles'

const HeaderFlex = styled(Flex)`
  min-height: 25px;
`

const BreadcrumbsButton = styled(Button)(({theme}) => {
  const fg = theme.sanity.color.base.fg
  return css`
    --card-fg-color: ${fg};
  `
})

interface CommentThreadLayoutProps {
  breadcrumbs?: CommentListBreadcrumbs
  canCreateNewThread: boolean
  children: React.ReactNode
  currentUser: CurrentUser
  fieldPath: string
  mentionOptions: MentionOptionsHookValue
  onNewThreadCreate: (payload: CommentCreatePayload) => void
  onPathSelect?: (path: Path) => void
}

export function CommentThreadLayout(props: CommentThreadLayoutProps) {
  const {
    breadcrumbs,
    canCreateNewThread,
    children,
    currentUser,
    fieldPath,
    mentionOptions,
    onNewThreadCreate,
    onPathSelect,
  } = props
  const [displayNewThreadInput, setDisplayNewThreadInput] = useState<boolean>(false)
  const [newThreadButtonElement, setNewThreadButtonElement] = useState<HTMLButtonElement | null>(
    null,
  )

  const onCreateNewThreadClick = useCallback(() => {
    setDisplayNewThreadInput(true)
  }, [])

  const handleNewThreadCreateDiscard = useCallback(() => {
    setDisplayNewThreadInput(false)
  }, [])

  const handleBreadcrumbsClick = useCallback(() => {
    onPathSelect?.(PathUtils.fromString(fieldPath))
  }, [fieldPath, onPathSelect])

  const handleNewThreadCreate = useCallback(
    (payload: CommentMessage) => {
      const nextComment: CommentCreatePayload = {
        fieldPath,
        message: payload,
        parentCommentId: undefined,
        status: 'open',
        // Since this is a new comment, we generate a new thread ID
        threadId: uuid(),
      }

      onNewThreadCreate?.(nextComment)
      setDisplayNewThreadInput(false)

      // When the new thread is created, we focus the button again
      newThreadButtonElement?.focus()
    },
    [newThreadButtonElement, onNewThreadCreate, fieldPath],
  )

  const crumbsTitlePath = useMemo(() => breadcrumbs?.map((p) => p.title) || [], [breadcrumbs])
  const lastCrumb = crumbsTitlePath[crumbsTitlePath.length - 1]

  return (
    <Stack space={2}>
      <HeaderFlex align="center" gap={2} paddingRight={1} sizing="border">
        <Stack flex={1}>
          <Flex align="center">
            <BreadcrumbsButton
              aria-label={`Go to ${lastCrumb} field`}
              mode="bleed"
              onClick={handleBreadcrumbsClick}
              padding={2}
            >
              <CommentBreadcrumbs maxLength={3} titlePath={crumbsTitlePath} />
            </BreadcrumbsButton>
          </Flex>
        </Stack>

        {canCreateNewThread && (
          <TextTooltip text="Start a new thread">
            <Button
              aria-label="Start a new thread"
              fontSize={1}
              icon={AddCommentIcon}
              mode="bleed"
              onClick={onCreateNewThreadClick}
              padding={2}
              ref={setNewThreadButtonElement}
            />
          </TextTooltip>
        )}
      </HeaderFlex>

      {displayNewThreadInput && (
        <ThreadCard tone="primary">
          <CreateNewThreadInput
            currentUser={currentUser}
            mentionOptions={mentionOptions}
            onEditDiscard={handleNewThreadCreateDiscard}
            onNewThreadCreate={handleNewThreadCreate}
            openButtonElement={newThreadButtonElement}
          />
        </ThreadCard>
      )}

      <Stack space={2}>{children}</Stack>
    </Stack>
  )
}
