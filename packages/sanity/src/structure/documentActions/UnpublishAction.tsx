import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionModalDialogProps,
  getPairTarget,
  getTargetScopeId,
  getTargetSiblings,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  usePerspective,
  useTranslation,
} from 'sanity'

import {ConfirmDeleteDialog} from '../components/confirmDeleteDialog'
import {structureLocaleNamespace} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'

const DISABLED_REASON_KEY = {
  ALREADY_UNPUBLISHED: 'action.unpublish.disabled.already-unpublished',
  NOT_PUBLISHED: 'action.unpublish.disabled.not-published',
  NOT_READY: 'action.unpublish.disabled.not-ready',
  LIVE_EDIT_ENABLED: 'action.unpublish.disabled.live-edit-enabled',
  TARGET_NOT_FOUND: 'action.unpublish.disabled.target-not-found',
}

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useUnpublishAction: DocumentActionComponent = ({
  id,
  type,
  draft,
  liveEditSchemaType,
  release,
}) => {
  const {targetDocumentState} = useDocumentPane()
  // The scope of the document targeted by the selected perspective, so that published variant
  // documents can be unpublished (undefined when the target is still resolving or the
  // draft/published pair applies). While resolving, the action is disabled below instead of
  // silently operating on the base pair.
  const isTargetReady = targetDocumentState.status === 'ready'
  const scopeId = getTargetScopeId(targetDocumentState)
  const isVariantTarget = isTargetReady && targetDocumentState.variant !== undefined
  // Unpublishable only when a published document exists in the current lane — the base published
  // document when no variant is selected, the variant-of-published sibling when one is.
  const siblings = getTargetSiblings(targetDocumentState)
  const hasSiblings = Boolean(siblings)
  const publishedExists = Boolean(siblings?.published)
  const {unpublish} = useDocumentOperation(id, type, getPairTarget(targetDocumentState))
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: scopeId,
    permission: 'unpublish',
  })
  const currentUser = useCurrentUser()
  const {t} = useTranslation(structureLocaleNamespace)
  const {selectedPerspective} = usePerspective()

  const isDraft = selectedPerspective === 'drafts'

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
  }, [])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    unpublish.execute()
  }, [unpublish])

  const dialog: DocumentActionModalDialogProps | null = useMemo(() => {
    if (isConfirmDialogOpen) {
      return {
        type: 'dialog',
        onClose: handleCancel,
        content: (
          <ConfirmDeleteDialog
            id={draft?._id || id}
            type={type}
            action="unpublish"
            // Published variants can always be unpublished — incoming refs point
            // at the base published id, not the variant id.
            checkIncomingReferences={!isVariantTarget}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        ),
      }
    }

    return null
  }, [draft, handleCancel, handleConfirm, id, isConfirmDialogOpen, isVariantTarget, type])

  return useMemo(() => {
    if (release || isDraft) {
      // Version documents cannot be unpublished by this action, they should be unpublished as part of a release
      // Draft documents can't either
      return null
    }
    // `liveEdit` is forced to true whenever a version is checked out, which includes variant
    // targets — for those, only the schema-level live edit setting should hide the action
    // (the variant-of-published document is unpublishable).
    if (liveEditSchemaType) {
      return null
    }

    if (!isPermissionsLoading && !permissions?.granted) {
      return {
        tone: 'critical',
        icon: UnpublishIcon,
        label: 'Unpublish',
        title: (
          <InsufficientPermissionsMessage context="unpublish-document" currentUser={currentUser} />
        ),
        disabled: true,
      }
    }

    if (hasSiblings && !publishedExists) {
      return {
        tone: 'critical',
        icon: UnpublishIcon,
        disabled: true,
        label: t('action.unpublish.label'),
        title: t(DISABLED_REASON_KEY.NOT_PUBLISHED),
      }
    }

    return {
      tone: 'critical',
      icon: UnpublishIcon,
      disabled: Boolean(unpublish.disabled) || isPermissionsLoading || !isTargetReady,
      label: t('action.unpublish.label'),
      title: unpublish.disabled ? t(DISABLED_REASON_KEY[unpublish.disabled]) : '',
      onHandle: handle,
      dialog,
    }
  }, [
    release,
    isDraft,
    liveEditSchemaType,
    isPermissionsLoading,
    isTargetReady,
    publishedExists,
    hasSiblings,
    permissions?.granted,
    unpublish.disabled,
    t,
    dialog,
    handle,
    currentUser,
  ])
}

useUnpublishAction.action = 'unpublish'
useUnpublishAction.displayName = 'UnpublishAction'
