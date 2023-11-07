import {CurrentUser} from '@sanity/types'
import {Button, Flex, Stack} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {uuid} from '@sanity/uuid'
import styled, {css} from 'styled-components'
import {
  CommentMessage,
  CommentCreatePayload,
  MentionOptionsHookValue,
  CommentListBreadcrumbs,
} from '../../types'
import {CommentBreadcrumbs} from '../CommentBreadcrumbs'
import {CommentsSelectedPath} from '../../context'
import {CreateNewThreadInput} from './CreateNewThreadInput'
import {ThreadCard} from './styles'

const HeaderFlex = styled(Flex)`
  min-height: 25px;
`

const BreadcrumbsButton = styled(Button)(({theme}) => {
  const fg = theme.sanity.color.base.fg
  return css`
    --card-fg-color: ${fg};

    // The width is needed to make the text ellipsis work
    // in the breadcrumbs component
    max-width: 100%;
  `
})

interface CommentThreadLayoutProps {
  breadcrumbs?: CommentListBreadcrumbs
  canCreateNewThread: boolean
  children: React.ReactNode
  currentUser: CurrentUser
  fieldPath: string
  isSelected: boolean
  mentionOptions: MentionOptionsHookValue
  onNewThreadCreate: (payload: CommentCreatePayload) => void
  onPathSelect?: (nextPath: CommentsSelectedPath) => void
  readOnly?: boolean
}

export function CommentThreadLayout(props: CommentThreadLayoutProps) {
  const {
    breadcrumbs,
    canCreateNewThread,
    children,
    currentUser,
    fieldPath,
    isSelected,
    mentionOptions,
    onNewThreadCreate,
    onPathSelect,
    readOnly,
  } = props

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
    },
    [onNewThreadCreate, fieldPath],
  )

  const handleBreadcrumbsClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      onPathSelect?.({
        fieldPath,
        origin: 'inspector',
        threadId: null,
      })
    },
    [fieldPath, onPathSelect],
  )

  const handleNewThreadClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      // Skip if the click was triggered from "Enter" keydown.
      // This because we don't want to trigger `onPathSelect` when
      // submitting the new thread form.
      if (e.detail === 0) return

      onPathSelect?.({
        fieldPath,
        origin: 'inspector',
        threadId: null,
      })
    },
    [fieldPath, onPathSelect],
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
      </HeaderFlex>

      {canCreateNewThread && (
        <ThreadCard onClick={handleNewThreadClick} tone={isSelected ? 'primary' : undefined}>
          <CreateNewThreadInput
            currentUser={currentUser}
            fieldName={lastCrumb}
            mentionOptions={mentionOptions}
            onNewThreadCreate={handleNewThreadCreate}
            readOnly={readOnly}
          />
        </ThreadCard>
      )}

      <Stack space={2}>{children}</Stack>
    </Stack>
  )
}
