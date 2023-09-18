import {CurrentUser, Path} from '@sanity/types'
<<<<<<< HEAD
import {Box, Breadcrumbs, Button, Card, Flex, Stack, Text} from '@sanity/ui'
=======
import {Badge, Box, Breadcrumbs, Button, Card, Flex, Stack, Text} from '@sanity/ui'
>>>>>>> d2d61b0cce (feat: improve comment breadcrumbs)
import React, {useCallback, useRef, useState} from 'react'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import styled from 'styled-components'
import {ChevronRightIcon, WarningOutlineIcon} from '@sanity/icons'
import {AddCommentIcon} from '../icons'
import {MentionOptionsHookValue} from '../../hooks'
import {CommentInputHandle} from '../pte'
import {CommentMessage, CommentCreatePayload, CommentBreadcrumbs} from '../../types'
import {TextTooltip} from '../TextTooltip'
import {CreateNewThreadInput} from './CreateNewThreadInput'
import {ThreadCard} from './styles'

const BreadcrumbsFlex = styled(Flex)`
  min-height: 25px;
`

interface CommentThreadLayoutProps {
  breadcrumbs?: CommentBreadcrumbs
<<<<<<< HEAD
  canCreateNewThread: boolean
=======
>>>>>>> d2d61b0cce (feat: improve comment breadcrumbs)
  children: React.ReactNode
  currentUser: CurrentUser
  hasInvalidField?: boolean
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
    hasInvalidField,
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
    <Stack space={2}>
      {hasInvalidField && (
        <BreadcrumbsFlex align="center" gap={2} paddingX={1} sizing="border">
          <Card tone="caution" style={{background: 'transparent'}}>
            <Text size={1} muted>
              <WarningOutlineIcon />
            </Text>
          </Card>

          <Box flex={1}>
            <Text textOverflow="ellipsis" size={1} muted>
              <b>Missing field: </b> ({PathUtils.toString(path)})
            </Text>
          </Box>
        </BreadcrumbsFlex>
      )}

      {!hasInvalidField && (
        <BreadcrumbsFlex align="center" gap={2} paddingX={1} sizing="border">
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
      )}

      {displayNewThreadInput && !hasInvalidField && (
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

      <Stack space={2}>{children}</Stack>
    </Stack>
  )
}
