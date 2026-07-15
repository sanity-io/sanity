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
   * Whether the document the copy actions would reference actually exists.
   *
   * This only matters when the pane is checked out on a *version* — a release bundle or a variant —
   * which `editState.scopeId` identifies (it's `undefined` for the base draft/published pair). If a
   * release perspective is pinned (or a variant is selected) but that version doesn't exist, copying
   * the id/URL would hand out a `versions.<scopeId>.<id>` reference to a document that isn't there,
   * so we disable the button.
   *
   * The base draft/published pair always allows sharing: a missing draft is represented by a
   * pseudo-draft, so there's still a meaningful document to share.
   *
   * Gated on `editState.ready` so we don't flash the disabled state while the initial snapshots are
   * still loading (all snapshots are `null` until then).
   */
  const documentExists = useMemo(() => {
    if (!editState?.ready) return true
    if (!editState.scopeId) return true
    return Boolean(editState.version)
  }, [editState])

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
