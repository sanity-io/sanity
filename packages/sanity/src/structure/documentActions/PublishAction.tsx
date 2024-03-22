import {PublishIcon} from '@sanity/icons'
import {createOrReplace, delete_} from '@sanity/mutate'
import {useTelemetry} from '@sanity/telemetry/react'
import {isValidationErrorMarker} from '@sanity/types'
import {useCallback, useEffect, useState} from 'react'
import {
  type DocumentActionComponent,
  getPublishedId,
  InsufficientPermissionsMessage,
  type TFunction,
  useBufferedDataset,
  useClient,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useEditState2,
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
  const {id, type, liveEdit} = props
  const [publishState, setPublishState] = useState<'publishing' | 'published' | null>(null)
  const {publish} = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id, type)
  const {draft, published} = useEditState2(id, type)
  const {changesOpen, onHistoryOpen, documentId, documentType} = useDocumentPane()

  const {t} = useTranslation(structureLocaleNamespace)

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
  const dataset = useBufferedDataset(useClient({apiVersion: 'v2024-04-07'}))

  const doPublish = useCallback(() => {
    if (!draft) {
      throw new Error('Nothing to publish')
    }
    dataset.mutate([
      createOrReplace({
        ...draft,
        _updatedAt: new Date().toISOString(),
        _id: getPublishedId(draft._id!),
      }),
      delete_(draft._id!),
    ])
  }, [dataset, draft])

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

  const telemetry = useTelemetry()

  const handle = useCallback(() => {
    telemetry.log(DocumentPublished, {
      publishedImmediately: !draft?._createdAt,
      previouslyPublished: Boolean(published),
    })
    if (syncState.isSyncing || validationStatus.isValidating) {
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
    doPublish,
  ])

  if (liveEdit) {
    return {
      tone: 'default',
      icon: PublishIcon,
      label: t('action.publish.live-edit.label'),
      title: t('action.publish.live-edit.tooltip'),
      disabled: true,
    }
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      tone: 'default',
      icon: PublishIcon,
      label: 'Publish',
      title: (
        <InsufficientPermissionsMessage context="publish-document" currentUser={currentUser} />
      ),
      disabled: true,
    }
  }

  const disabled = Boolean(
    publishScheduled ||
      publishState === 'publishing' ||
      publishState === 'published' ||
      hasValidationErrors ||
      !draft,
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
}

PublishAction.action = 'publish'
