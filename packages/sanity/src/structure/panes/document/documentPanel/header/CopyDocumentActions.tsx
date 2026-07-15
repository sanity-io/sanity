import {LinkIcon} from '@sanity/icons/Link'
import {ShareIcon} from '@sanity/icons/Share'
import {TargetIcon} from '@sanity/icons/Target'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {getDraftId, getVersionId, usePerspective, useStudioUrl, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {usePaneRouter} from '../../../../components'
import {structureLocaleNamespace} from '../../../../i18n'
import {DocumentIDCopied, DocumentURLCopied} from '../../__telemetry__'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentPaneInfo} from '../../useDocumentPaneInfo'

/**
 * Renders a dropdown button in the document panel header with two actions:
 * - Copy link to document (perspective-aware URL)
 * - Copy document ID (prefixed for versions/drafts, plain for published and live edit types)
 *
 * @internal
 */
export function CopyDocumentActions() {
  const {documentId, documentType, schemaType} = useDocumentPaneInfo()
  const {editState} = useDocumentPane()
  const {selectedReleaseId, selectedPerspectiveName} = usePerspective()
  const {params} = usePaneRouter()
  const {resolveIntentLink} = useRouter()
  const {buildIntentUrl} = useStudioUrl()
  const {t} = useTranslation(structureLocaleNamespace)
  const telemetry = useTelemetry()
  const {push: pushToast} = useToast()

  const scheduledDraft = params?.scheduledDraft

  const contextAwareDocumentId = useMemo(() => {
    const versionReleaseId = scheduledDraft || selectedReleaseId
    if (versionReleaseId) {
      return getVersionId(documentId, versionReleaseId)
    }

    if (selectedPerspectiveName === 'published' || schemaType?.liveEdit) {
      return documentId
    }

    return getDraftId(documentId)
  }, [documentId, scheduledDraft, schemaType?.liveEdit, selectedPerspectiveName, selectedReleaseId])

  /**
   * Whether the document referenced by `contextAwareDocumentId` actually exists in the current
   * perspective. When a release perspective is pinned but the document isn't part of that release
   * (or when viewing a published/draft that doesn't exist yet), copying the id/URL would hand out a
   * reference to a document that doesn't exist. In that case we disable the button.
   *
   * Gated on `editState.ready` so we don't flash the disabled state while the initial snapshots are
   * still loading (all snapshots are `null` until then).
   */
  const documentExists = useMemo(() => {
    if (!editState?.ready) return true

    const versionReleaseId = scheduledDraft || selectedReleaseId
    if (versionReleaseId) {
      return Boolean(editState.version)
    }

    if (selectedPerspectiveName === 'published' || schemaType?.liveEdit) {
      return Boolean(editState.published)
    }

    return Boolean(editState.draft || editState.published)
  }, [editState, scheduledDraft, selectedReleaseId, selectedPerspectiveName, schemaType?.liveEdit])

  const handleCopyLink = useCallback(async () => {
    telemetry.log(DocumentURLCopied)

    const searchParams: [string, string][] =
      selectedReleaseId && !scheduledDraft ? [['perspective', selectedReleaseId]] : []

    const intentParams = {
      id: documentId,
      type: documentType,
      ...(scheduledDraft && {scheduledDraft}),
    }

    const intentLink = resolveIntentLink('edit', intentParams, searchParams)
    const copyUrl = buildIntentUrl(intentLink)

    await navigator.clipboard.writeText(copyUrl)
    pushToast({
      id: 'copy-document-url',
      status: 'info',
      title: t('panes.document-operation-results.operation-success_copy-url'),
    })
  }, [
    buildIntentUrl,
    documentId,
    documentType,
    pushToast,
    resolveIntentLink,
    scheduledDraft,
    selectedReleaseId,
    t,
    telemetry,
  ])

  const handleCopyId = useCallback(async () => {
    telemetry.log(DocumentIDCopied)
    await navigator.clipboard.writeText(contextAwareDocumentId)
    pushToast({
      id: 'copy-document-id',
      status: 'info',
      title: t('panes.document-operation-results.operation-success_copy-id'),
    })
  }, [contextAwareDocumentId, pushToast, t, telemetry])

  return (
    <MenuButton
      id="copy-document-actions"
      button={
        <Button
          icon={ShareIcon}
          mode="bleed"
          disabled={!documentExists}
          tooltipProps={{
            content: documentExists
              ? t('action.copy-document-url.label')
              : t('action.copy-document-url.disabled.no-document'),
          }}
          data-testid="copy-document-actions-button"
        />
      }
      menu={
        <Menu>
          <MenuItem
            icon={LinkIcon}
            onClick={handleCopyLink}
            text={t('action.copy-link-to-document.label')}
            data-testid="copy-link-to-document"
          />
          <MenuItem
            icon={TargetIcon}
            onClick={handleCopyId}
            text={t('action.copy-document-id.label')}
            data-testid="copy-document-id"
          />
        </Menu>
      }
      popover={{portal: true, placement: 'bottom-end'}}
    />
  )
}
