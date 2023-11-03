import {CurrentUser, Path} from '@sanity/types'
import {Button, Flex, Stack} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {uuid} from '@sanity/uuid'
import styled, {css} from 'styled-components'
import * as PathUtils from '@sanity/util/paths'
import {
  CommentMessage,
  CommentCreatePayload,
  MentionOptionsHookValue,
  CommentListBreadcrumbs,
} from '../../types'
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
  mentionOptions: MentionOptionsHookValue
  onNewThreadCreate: (payload: CommentCreatePayload) => void
  onPathSelect?: (path: Path) => void
  readOnly?: boolean
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
    readOnly,
  } = props

  const selectPath = useCallback(() => {
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
    },
    [onNewThreadCreate, fieldPath],
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
              onClick={selectPath}
              padding={2}
            >
              <CommentBreadcrumbs maxLength={3} titlePath={crumbsTitlePath} />
            </BreadcrumbsButton>
          </Flex>
        </Stack>
      </HeaderFlex>

      {canCreateNewThread && (
        <ThreadCard>
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
