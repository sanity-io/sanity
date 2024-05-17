import {type CurrentUser} from '@sanity/types'
import {
  // eslint-disable-next-line no-restricted-imports
  Button, // Button with specific styling and children behavior.
  Flex,
  Stack,
} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {type MouseEvent, type ReactNode, useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {type UserListWithPermissionsHookValue} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {type CommentsSelectedPath} from '../../context'
import {commentsLocaleNamespace} from '../../i18n'
import {
  type CommentBaseCreatePayload,
  type CommentListBreadcrumbs,
  type CommentMessage,
  type CommentsUIMode,
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
  children: ReactNode
  currentUser: CurrentUser
  fieldPath: string
  isSelected: boolean
  mentionOptions: UserListWithPermissionsHookValue
  mode: CommentsUIMode
  onNewThreadCreate: (payload: CommentBaseCreatePayload) => void
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
    mode,
    onNewThreadCreate,
    onPathSelect,
    readOnly,
  } = props

  const {t} = useTranslation(commentsLocaleNamespace)

  const handleNewThreadCreate = useCallback(
    (payload: CommentMessage) => {
      const nextComment: CommentBaseCreatePayload = {
        message: payload,
        parentCommentId: undefined,
        status: 'open',
        // Since this is a new comment, we generate a new thread ID
        threadId: uuid(),
        // New comments have no reactions
        reactions: [],

        payload: {
          fieldPath,
        },
      }

      onNewThreadCreate?.(nextComment)
    },
    [onNewThreadCreate, fieldPath],
  )

  const handleBreadcrumbsClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
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
    (e: MouseEvent<HTMLDivElement>) => {
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
              aria-label={t('list-item.breadcrumb-button-go-to-field-aria-label', {
                field: lastCrumb,
              })}
              mode="bleed"
              onClick={handleBreadcrumbsClick}
              padding={2}
              space={2}
            >
              <CommentBreadcrumbs maxLength={3} titlePath={crumbsTitlePath} />
            </BreadcrumbsButton>
          </Flex>
        </Stack>
      </HeaderFlex>

      {canCreateNewThread && (
        <ThreadCard onClick={handleNewThreadClick} data-active={isSelected}>
          <CreateNewThreadInput
            currentUser={currentUser}
            fieldTitle={lastCrumb}
            mentionOptions={mentionOptions}
            mode={mode}
            onNewThreadCreate={handleNewThreadCreate}
            readOnly={readOnly}
          />
        </ThreadCard>
      )}

      <Stack space={2}>{children}</Stack>
    </Stack>
  )
}
