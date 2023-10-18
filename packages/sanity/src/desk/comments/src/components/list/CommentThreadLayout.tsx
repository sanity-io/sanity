import {CurrentUser} from '@sanity/types'
import {Box, Breadcrumbs, Button, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback, useRef, useState} from 'react'
import {uuid} from '@sanity/uuid'
import styled from 'styled-components'
import {ChevronRightIcon} from '@sanity/icons'
import {AddCommentIcon} from '../icons'
import {CommentInputHandle} from '../pte'
import {
  CommentMessage,
  CommentCreatePayload,
  CommentBreadcrumbs,
  MentionOptionsHookValue,
} from '../../types'
import {TextTooltip} from '../TextTooltip'
import {CreateNewThreadInput} from './CreateNewThreadInput'
import {ThreadCard} from './styles'

const HeaderFlex = styled(Flex)`
  min-height: 25px;
`

interface CommentThreadLayoutProps {
  breadcrumbs?: CommentBreadcrumbs
  canCreateNewThread: boolean
  children: React.ReactNode
  currentUser: CurrentUser
  mentionOptions: MentionOptionsHookValue
  onNewThreadCreate: (payload: CommentCreatePayload) => void
  fieldPath: string
}

export function CommentThreadLayout(props: CommentThreadLayoutProps) {
  const {
    breadcrumbs,
    canCreateNewThread,
    children,
    currentUser,
    mentionOptions,
    onNewThreadCreate,
    fieldPath,
  } = props
  const createNewThreadInputRef = useRef<CommentInputHandle>(null)
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

  return (
    <Stack space={2}>
      <HeaderFlex align="center" gap={2} paddingLeft={2} paddingRight={1} sizing="border">
        <Stack flex={1}>
          <Breadcrumbs
            maxLength={3}
            separator={
              <Text muted size={1}>
                <ChevronRightIcon />
              </Text>
            }
          >
            {breadcrumbs?.map((p, index) => {
              const idx = `${p.title}-${index}`

              return (
                <Box key={idx}>
                  <Text size={1} weight="semibold" textOverflow="ellipsis">
                    {p.title}
                  </Text>
                </Box>
              )
            })}
          </Breadcrumbs>
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
            ref={createNewThreadInputRef}
          />
        </ThreadCard>
      )}

      <Stack space={2}>{children}</Stack>
    </Stack>
  )
}
