import {PublishIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {isValidationErrorMarker} from '@sanity/types'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  InsufficientPermissionsMessage,
  isPublishedId,
  type TFunction,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useEditState,
  useRelativeTime,
  useSyncState,
  useTranslation,
  useValidationStatus,
} from 'sanity'

import {structureLocaleNamespace, type StructureLocaleResourceKeys} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {DocumentPublished} from './__telemetry__/documentActions.telemetry'

const DISABLED_REASON_TITLE_KEY: Record<string, StructureLocaleResourceKeys> = {
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
  const {t} = useTranslation(structureLocaleNamespace)
  const timeSincePublished = useRelativeTime(publishedAt, {useTemporalPhrase: true})
  return <span>{t('action.publish.already-published.tooltip', {timeSincePublished})}</span>
}

/** @internal */
// eslint-disable-next-line complexity
export const PublishAction: DocumentActionComponent = (props) => {
  const {id, type, liveEdit, draft, published, release} = props
  const [publishState, setPublishState] = useState<'publishing' | 'published' | null>(null)
  const {publish} = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id, type)
  const {changesOpen, documentId, documentType, value} = useDocumentPane()
  const editState = useEditState(documentId, documentType)
  const {t} = useTranslation(structureLocaleNamespace)

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
      ? t('action.publish.validation-issues.tooltip')
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

    const nextState = didPublish ? 'published' : null
    const delay = didPublish ? 200 : 4000
    const timer = setTimeout(() => {
      setPublishState(nextState)
    }, delay)
    return () => clearTimeout(timer)
  }, [changesOpen, publishState, hasDraft])

  const telemetry = useTelemetry()

  const handle = useCallback(() => {
    telemetry.log(DocumentPublished, {
      publishedImmediately: !draft?._createdAt,
      previouslyPublished: Boolean(published),
    })
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
    telemetry,
    draft?._createdAt,
    published,
    syncState.isSyncing,
    validationStatus.isValidating,
    validationStatus.revision,
    revision,
    doPublish,
  ])

  return useMemo(() => {
    if (release) {
      // Version documents are not publishable by this action, they should be published as part of a release
      return null
    }
    if (liveEdit) {
      // Live edit documents are not publishable by this action, they are published automatically
      return null
    }

    /**
     * When draft is null, if not a published or version document
     * then it means the draft is yet to be saved - in this case don't disabled
     * the publish button due to ALREADY_PUBLISHED reason
     */
    if (isPublishedId(value._id) && draft !== null) {
      return {
        tone: 'default',
        icon: PublishIcon,
        label: t('action.publish.label'),
        title: getDisabledReason('ALREADY_PUBLISHED', published?._updatedAt, t),
        disabled: true,
      }
    }

    if (!isPermissionsLoading && !permissions?.granted) {
      return {
        tone: 'default',
        icon: PublishIcon,
        label: t('action.publish.label'),
        title: (
          <InsufficientPermissionsMessage context="publish-document" currentUser={currentUser} />
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
      tone: 'default',
      label:
        // eslint-disable-next-line no-nested-ternary
        publishState === 'published'
          ? t('action.publish.published.label')
          : publishScheduled || publishState === 'publishing'
            ? t('action.publish.running.label')
            : t('action.publish.draft.label'),
      // @todo: Implement loading state, to show a `<Button loading />` state
      // loading: publishScheduled || publishState === 'publishing',
      icon: PublishIcon,
      // eslint-disable-next-line no-nested-ternary
      title: publishScheduled
        ? t('action.publish.waiting')
        : publishState === 'published' || publishState === 'publishing'
          ? null
          : title,
      shortcut: disabled || publishScheduled ? null : 'Ctrl+Alt+P',
      onHandle: handle,
    }
  }, [
    release,
    liveEdit,
    value._id,
    draft,
    isPermissionsLoading,
    permissions?.granted,
    publishScheduled,
    editState?.transactionSyncLock?.enabled,
    publishState,
    hasValidationErrors,
    publish.disabled,
    t,
    title,
    handle,
    published?._updatedAt,
    currentUser,
  ])
}

PublishAction.action = 'publish'
PublishAction.displayName = 'PublishAction'
