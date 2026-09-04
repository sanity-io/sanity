import {type CurrentUser} from '@sanity/types'
import {
  // oxlint-disable-next-line no-restricted-imports
  Button, // Button with specific styling and children behavior.
  useTheme_v2 as useThemeV2,
} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type MouseEvent, type ReactNode, useCallback, useMemo} from 'react'
import {Flex, VStack} from 'ui5'

import {type UserListWithPermissionsHookValue} from '../../../hooks/useUserListWithPermissions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type CommentsSelectedPath} from '../../context/selected-path/types'
import {commentsLocaleNamespace} from '../../i18n'
import {
  type CommentBaseCreatePayload,
  type CommentListBreadcrumbs,
  type CommentMessage,
  type CommentsUIMode,
} from '../../types'
import {CommentBreadcrumbs} from '../CommentBreadcrumbs'
import {baseFgVar, breadcrumbsButton, headerFlex} from './CommentThreadLayout.css'
import {CreateNewThreadInput} from './CreateNewThreadInput'
import {ThreadCard} from './styles'

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
  const {color} = useThemeV2()

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
    <VStack gap={2}>
      <Flex alignItems="center" gap={2} paddingRight={1} className={headerFlex}>
        <Flex flexBasis="0%" flexGrow={1} flexDirection="column">
          <Flex alignItems="center">
            <Button
              aria-label={t('list-item.breadcrumb-button-go-to-field-aria-label', {
                field: lastCrumb,
              })}
              className={breadcrumbsButton}
              mode="bleed"
              onClick={handleBreadcrumbsClick}
              padding={2}
              gap={2}
              style={assignInlineVars({[baseFgVar]: color.fg})}
            >
              <CommentBreadcrumbs maxLength={3} titlePath={crumbsTitlePath} />
            </Button>
          </Flex>
        </Flex>
      </Flex>

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

      <VStack gap={2}>{children}</VStack>
    </VStack>
  )
}
