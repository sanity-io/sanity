import {CheckmarkIcon, PublishIcon} from '@sanity/icons'
import {isValidationErrorMarker} from '@sanity/types'
import React, {useCallback, useEffect, useState} from 'react'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {deskLocaleNamespace, type DeskLocaleResourceKeys} from '../i18n'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  TFunction,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useEditState,
  useSyncState,
  useTimeAgo,
  useTranslation,
  useValidationStatus,
} from 'sanity'

const DISABLED_REASON_TITLE_KEY: Record<string, DeskLocaleResourceKeys> = {
  LIVE_EDIT_ENABLED: 'action.publish.live-edit.publish-disabled',
  ALREADY_PUBLISHED: 'action.publish.already-published.no-time-ago.tooltip',
  NO_CHANGES: 'action.publish.no-changes.tooltip',
  NOT_READY: 'action.publish.disabled.not-ready',
} as const

function getDisabledReason(
  reason: keyof typeof DISABLED_REASON_TITLE_KEY,
  publishedAt: string | undefined,
  t: TFunction,
) {
  if (reason === 'ALREADY_PUBLISHED' && publishedAt) {
    return <AlreadyPublished publishedAt={publishedAt} />
  }
  return t(DISABLED_REASON_TITLE_KEY[reason])
}

function AlreadyPublished({publishedAt}: {publishedAt: string}) {
  const {t} = useTranslation(deskLocaleNamespace)
  const timeSincePublished = useTimeAgo(publishedAt)
  return <span>{t('action.publish.alreadyPublished.tooltip', {timeSincePublished})}</span>
}

/** @internal */
// eslint-disable-next-line complexity
export const PublishAction: DocumentActionComponent = (props) => {
  const {id, type, liveEdit, draft, published} = props
  const [publishState, setPublishState] = useState<'publishing' | 'published' | null>(null)
  const {publish} = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id, type)
  const {changesOpen, onHistoryOpen, documentId, documentType} = useDocumentPane()
  const editState = useEditState(documentId, documentType)
  const {t} = useTranslation(deskLocaleNamespace)

  const revision = (editState?.draft || editState?.published || {})._rev

  const hasValidationErrors = validationStatus.validation.some(isValidationErrorMarker)
  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = useState<boolean>(false)
  const isSyncing = syncState.isSyncing
  const isValidating = validationStatus.isValidating
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'publish',
  })

  const currentUser = useCurrentUser()

  // eslint-disable-next-line no-nested-ternary
  const title = publish.disabled
    ? getDisabledReason(publish.disabled, (published || {})._updatedAt, t) || ''
    : hasValidationErrors
    ? t('action.publish.validationIssues.tooltip')
    : ''

  const hasDraft = Boolean(draft)

  const doPublish = useCallback(() => {
    publish.execute()
    setPublishState('publishing')
  }, [publish])

  useEffect(() => {
    // make sure the validation status is about the current revision and not an earlier one
    const validationComplete =
      validationStatus.isValidating === false && validationStatus.revision !== revision

    if (!publishScheduled || isSyncing || !validationComplete) {
      return
    }

    if (!hasValidationErrors) {
      doPublish()
    }
    setPublishScheduled(false)
  }, [
    isSyncing,
    doPublish,
    hasValidationErrors,
    publishScheduled,
    validationStatus.revision,
    revision,
    isValidating,
    validationStatus.isValidating,
  ])

  useEffect(() => {
    const didPublish = publishState === 'publishing' && !hasDraft
    if (didPublish) {
      if (changesOpen) {
        // Re-open the panel
        onHistoryOpen()
      }
    }
    const nextState = didPublish ? 'published' : null
    const delay = didPublish ? 200 : 4000
    const timer = setTimeout(() => {
      setPublishState(nextState)
    }, delay)
    return () => clearTimeout(timer)
  }, [changesOpen, publishState, hasDraft, onHistoryOpen])

  const handle = useCallback(() => {
    if (
      syncState.isSyncing ||
      validationStatus.isValidating ||
      validationStatus.revision !== revision
    ) {
      setPublishScheduled(true)
    } else {
      doPublish()
    }
  }, [
    syncState.isSyncing,
    validationStatus.isValidating,
    validationStatus.revision,
    revision,
    doPublish,
  ])

  if (liveEdit) {
    return {
      tone: 'positive',
      label: t('action.publish.live-edit.label'),
      title: t('action.publish.live-edit.tooltip'),
      disabled: true,
    }
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      tone: 'positive',
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
      editState?.transactionSyncLock?.enabled ||
      publishState === 'publishing' ||
      publishState === 'published' ||
      hasValidationErrors ||
      publish.disabled,
  )

  return {
    disabled: disabled || isPermissionsLoading,
    tone: 'positive',
    label:
      // eslint-disable-next-line no-nested-ternary
      publishState === 'published'
        ? t('action.publish.published.label')
        : publishScheduled || publishState === 'publishing'
        ? t('action.publish.running.label')
        : t('action.publish.draft.label'),
    // @todo: Implement loading state, to show a `<Button loading />` state
    // loading: publishScheduled || publishState === 'publishing',
    icon: publishState === 'published' ? CheckmarkIcon : PublishIcon,
    // eslint-disable-next-line no-nested-ternary
    title: publishScheduled
      ? t('action.publish.waiting')
      : publishState === 'published' || publishState === 'publishing'
      ? null
      : title,
    shortcut: disabled || publishScheduled ? null : 'Ctrl+Alt+P',
    onHandle: handle,
  }
}

PublishAction.action = 'publish'
