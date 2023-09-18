import {CurrentUser, Path} from '@sanity/types'
import {Badge, Box, Breadcrumbs, Button, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback, useRef, useState} from 'react'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import styled from 'styled-components'
import {AddCommentIcon} from '../icons'
import {MentionOptionsHookValue} from '../../hooks'
import {CommentInputHandle} from '../pte'
import {CommentMessage, CommentCreatePayload, CommentBreadcrumbs} from '../../types'
import {TextTooltip} from '../TextTooltip'
import {ThreadCard} from './CommentsListItem'
import {CreateNewThreadInput} from './CreateNewThreadInput'

const BreadcrumbsFlex = styled(Flex)`
  min-height: 25px;
`

interface CommentThreadLayoutProps {
  breadcrumbs?: CommentBreadcrumbs
  canCreateNewThread: boolean
  children: React.ReactNode
  currentUser: CurrentUser
  threadId: string
  mentionOptions: MentionOptionsHookValue
  onNewThreadCreate: (payload: CommentCreatePayload) => void
  path: Path
}

export function CommentThreadLayout(props: CommentThreadLayoutProps) {
  const {
    breadcrumbs,
    canCreateNewThread,
    children,
    currentUser,
    threadId,
    mentionOptions,
    onNewThreadCreate,
    path,
  } = props
  const createNewThreadInputRef = useRef<CommentInputHandle>(null)
  const [displayNewThreadInput, setDisplayNewThreadInput] = useState<boolean>(false)

  const onCreateNewThreadClick = useCallback(() => {
    setDisplayNewThreadInput(true)

    // We need to wait for the next tick to focus the input
    const raf = requestAnimationFrame(() => {
      createNewThreadInputRef.current?.focus()
      createNewThreadInputRef.current?.scrollTo()
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [])

  const handleNewThreadCreateDiscard = useCallback(() => {
    setDisplayNewThreadInput(false)
  }, [])

  const handleNewThreadCreate = useCallback(
    (payload: CommentMessage) => {
      const nextComment: CommentCreatePayload = {
        fieldPath: PathUtils.toString(path),
        message: payload,
        parentCommentId: undefined,
        status: 'open',
        // Since this is a new comment, we generate a new thread ID
        threadId: uuid(),
      }

      onNewThreadCreate?.(nextComment)
      setDisplayNewThreadInput(false)
    },
    [onNewThreadCreate, path],
  )

  return (
    <Stack space={2} data-thread-id={threadId}>
      <BreadcrumbsFlex align="center" gap={2} paddingX={1} sizing="border">
        <Stack flex={1}>
          <Breadcrumbs maxLength={3}>
            {breadcrumbs?.map((p, index) => {
              const idx = `${p.title}-${index}`

              if (p.isArrayItem) {
                if (p.invalid) {
                  return (
                    <TextTooltip key={idx} text="The array item does no longer exist">
                      <Badge
                        aria-label="The array item does no longer exist"
                        fontSize={1}
                        mode="outline"
                        sizing="border"
                        tone="caution"
                      >
                        ?
                      </Badge>
                    </TextTooltip>
                  )
                }

                return (
                  <Box key={idx}>
                    <Badge fontSize={1} mode="outline" sizing="border">
                      {p.title}
                    </Badge>
                  </Box>
                )
              }

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
          <TextTooltip text="Start a new thread...">
            <Button
              aria-label="Start a new thread"
              fontSize={1}
              icon={AddCommentIcon}
              mode="bleed"
              onClick={onCreateNewThreadClick}
              padding={2}
            />
          </TextTooltip>
        )}
      </BreadcrumbsFlex>

      {displayNewThreadInput && (
        <ThreadCard tone="primary">
          <CreateNewThreadInput
            currentUser={currentUser}
            mentionOptions={mentionOptions}
            onNewThreadCreate={handleNewThreadCreate}
            onEditDiscard={handleNewThreadCreateDiscard}
            ref={createNewThreadInputRef}
          />
        </ThreadCard>
      )}

      {children}
    </Stack>
  )
}
