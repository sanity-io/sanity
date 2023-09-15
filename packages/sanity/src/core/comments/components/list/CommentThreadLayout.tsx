import {CurrentUser, Path} from '@sanity/types'
import {Box, Breadcrumbs, Button, Flex, Stack, Text} from '@sanity/ui'
import {startCase} from 'lodash'
import React, {useCallback, useRef, useState} from 'react'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {AddCommentIcon} from '../icons'
import {MentionOptionsHookValue} from '../../hooks'
import {CommentInputHandle} from '../pte'
import {CommentMessage, CommentCreatePayload} from '../../types'
import {TextTooltip} from '../TextTooltip'
import {ThreadCard} from './CommentsListItem'
import {CreateNewThreadInput} from './CreateNewThreadInput'

interface CommentThreadLayoutProps {
  children: React.ReactNode
  currentUser: CurrentUser
  mentionOptions: MentionOptionsHookValue
  onNewThreadCreate: (payload: CommentCreatePayload) => void
  path: Path
}

export function CommentThreadLayout(props: CommentThreadLayoutProps) {
  const {children, path, currentUser, mentionOptions, onNewThreadCreate} = props
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
    <Stack space={2}>
      <Flex align="center" gap={2} paddingX={1} sizing="border">
        <Stack flex={1}>
          <Breadcrumbs maxLength={3}>
            {path.map((p, index) => {
              const pathSegment = p.toString()
              const idx = `${pathSegment}-${index}`

              // If the path segment is an object, we don't want to render it since it
              // is not human readable, e.g: {_key: 'xyz}
              if (typeof p === 'object') return null

              return (
                <Box key={idx}>
                  <Text size={1} weight="semibold" textOverflow="ellipsis">
                    {startCase(pathSegment)}
                  </Text>
                </Box>
              )
            })}
          </Breadcrumbs>
        </Stack>

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
      </Flex>

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
