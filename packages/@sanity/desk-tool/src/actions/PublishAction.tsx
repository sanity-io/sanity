import {DocumentActionComponent, DocumentActionConfirmDialogProps} from '@sanity/base'
import {useSyncState, useDocumentOperation, useValidationStatus} from '@sanity/react-hooks'
import {CheckmarkIcon, CloseIcon, LinkIcon, PublishIcon} from '@sanity/icons'
import React, {useCallback, useEffect, useState} from 'react'
import styled from 'styled-components'
import {
  useCurrentUser,
  unstable_useDocumentPairPermissions as useDocumentPairPermissions,
} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'
import {TimeAgo} from '../components/TimeAgo'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {useDocumentsIsReferenced} from '../panes/document/useDocumentIsReferenced'
import {Box, Flex, Heading, Stack, Text} from '@sanity/ui'

const DISABLED_REASON_TITLE = {
  LIVE_EDIT_ENABLED: 'Cannot publish since liveEdit is enabled for this document type',
  ALREADY_PUBLISHED: 'Already published',
  NO_CHANGES: 'No unpublished changes',
}

function getDisabledReason(
  reason: keyof typeof DISABLED_REASON_TITLE,
  publishedAt: string | undefined
) {
  if (reason === 'ALREADY_PUBLISHED' && publishedAt) {
    return (
      <>
        <span>
          Published <TimeAgo time={publishedAt} />
        </span>
      </>
    )
  }
  return DISABLED_REASON_TITLE[reason]
}

// eslint-disable-next-line complexity
export const PublishAction: DocumentActionComponent = (props) => {
  const {id, type, liveEdit, draft, published} = props
  const [publishState, setPublishState] = useState<'publishing' | 'published' | null>(null)
  const {publish}: any = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id, type)
  const {changesOpen, handleHistoryOpen} = useDocumentPane()
  const hasValidationErrors = validationStatus.markers.some((marker) => marker.level === 'error')
  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = useState<boolean>(false)
  const isNeitherSyncingNorValidating = !syncState.isSyncing && !validationStatus.isValidating
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'publish',
  })
  const [isReferenced] = useDocumentsIsReferenced(id)
  const [showConfirmPublishReferencedDocument, setShowConfirmPublishReferencedDocument] = useState(
    false
  )

  //Deals with edge-case: if a reference is removed while the confirmation box is open, it will close
  useCallback(() => {
    if (isReferenced === false && showConfirmPublishReferencedDocument) {
      setShowConfirmPublishReferencedDocument(false)
    }
  }, [isReferenced, showConfirmPublishReferencedDocument])

  const {value: currentUser} = useCurrentUser()

  // eslint-disable-next-line no-nested-ternary
  const title = publish.disabled
    ? getDisabledReason(publish.disabled, (published || {})._updatedAt) || ''
    : hasValidationErrors
    ? 'There are validation errors that need to be fixed before this document can be published'
    : ''

  const hasDraft = Boolean(draft)

  const doPublish = useCallback(() => {
    publish.execute()
    setPublishState('publishing')
  }, [publish])

  useEffect(() => {
    if (publishScheduled && isNeitherSyncingNorValidating) {
      if (!hasValidationErrors) {
        doPublish()
      }

      setPublishScheduled(false)
    }
  }, [isNeitherSyncingNorValidating, doPublish, hasValidationErrors, publishScheduled])

  useEffect(() => {
    const didPublish = publishState === 'publishing' && !hasDraft
    if (didPublish) {
      if (changesOpen) {
        // Re-open the panel
        handleHistoryOpen()
      }
    }
    const nextState = didPublish ? 'published' : null
    const delay = didPublish ? 200 : 4000
    const timer = setTimeout(() => {
      setPublishState(nextState)
    }, delay)
    return () => clearTimeout(timer)
  }, [changesOpen, publishState, hasDraft, handleHistoryOpen])

  const handle = useCallback(() => {
    if (syncState.isSyncing || validationStatus.isValidating) {
      setPublishScheduled(true)
    } else {
      doPublish()
    }
  }, [syncState.isSyncing, validationStatus.isValidating, doPublish])

  if (liveEdit) {
    return {
      color: 'success',
      label: 'Publish',
      title:
        'Live Edit is enabled for this content type and publishing happens automatically as you make changes',
      disabled: true,
    }
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      color: 'success',
      label: 'Publish',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="publish this document"
          currentUser={currentUser}
        />
      ),
      disabled: true,
    }
  }

  const disabled = Boolean(
    publishScheduled ||
      publishState === 'publishing' ||
      publishState === 'published' ||
      hasValidationErrors ||
      publish.disabled
  )

  const dialog: DocumentActionConfirmDialogProps = {
    type: 'confirm',
    color: 'success',
    confirmButtonIcon: CheckmarkIcon,
    cancelButtonIcon: CloseIcon,
    onCancel: () => setShowConfirmPublishReferencedDocument(false),
    onConfirm: () => {
      handle()
      setShowConfirmPublishReferencedDocument(false)
    },
    message: (
      <Stack space={3}>
        <Flex marginBottom={2} align="center">
          <Box marginRight={2}>
            <LinkBox>
              <LinkIcon fontSize={'24'} />
            </LinkBox>
          </Box>
          <Heading size={1}>Referenced Document</Heading>
        </Flex>
        <Text>Publishing changes may affect documents that reference this document</Text>
      </Stack>
    ),
  }

  return {
    disabled: disabled || isPermissionsLoading,
    color: 'success',
    label:
      // eslint-disable-next-line no-nested-ternary
      publishState === 'published'
        ? 'Published'
        : publishScheduled || publishState === 'publishing'
        ? 'Publishing…'
        : 'Publish',
    // @todo: Implement loading state, to show a `<Button loading />` state
    // loading: publishScheduled || publishState === 'publishing',
    icon: publishState === 'published' ? CheckmarkIcon : PublishIcon,
    // eslint-disable-next-line no-nested-ternary
    title: publishScheduled
      ? 'Waiting for tasks to finish before publishing'
      : publishState === 'published' || publishState === 'publishing'
      ? null
      : title,
    shortcut: disabled || publishScheduled ? null : 'Ctrl+Alt+P',
    onHandle: isReferenced ? () => setShowConfirmPublishReferencedDocument(true) : handle,
    dialog: showConfirmPublishReferencedDocument ? dialog : undefined,
  }
}

const LinkBox = styled.div`
  border-color: #e8f1fe;
  border: 1px solid grey;
  border-radius: 50%;
  width: 25px;
  height: 25px;
`
