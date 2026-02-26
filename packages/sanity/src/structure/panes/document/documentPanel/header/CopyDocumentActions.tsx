import {LinkIcon, ShareIcon, TargetIcon} from '@sanity/icons'
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

/**
 * Renders a dropdown button in the document panel header with two actions:
 * - Copy link to document (perspective-aware URL)
 * - Copy document ID (context-aware, including version/draft prefix)
 *
 * @internal
 */
export function CopyDocumentActions() {
  const {documentId, documentType} = useDocumentPane()
  const {selectedReleaseId, selectedPerspectiveName} = usePerspective()
  const {params} = usePaneRouter()
  const {resolveIntentLink} = useRouter()
  const {buildStudioUrl} = useStudioUrl()
  const {t} = useTranslation(structureLocaleNamespace)
  const telemetry = useTelemetry()
  const {push: pushToast} = useToast()

  const scheduledDraft = params?.scheduledDraft

  const contextAwareDocumentId = useMemo(() => {
    const versionReleaseId = scheduledDraft || selectedReleaseId
    if (versionReleaseId) {
      return getVersionId(documentId, versionReleaseId)
    }

    if (selectedPerspectiveName === 'published') {
      return documentId
    }

    return getDraftId(documentId)
  }, [documentId, scheduledDraft, selectedPerspectiveName, selectedReleaseId])

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
    const appendIntentLink = (url: string) => `${url}${intentLink}`

    const copyUrl = buildStudioUrl({
      coreUi: appendIntentLink,
      studio: appendIntentLink,
    })

    await navigator.clipboard.writeText(copyUrl)
    pushToast({
      id: 'copy-document-url',
      status: 'info',
      title: t('panes.document-operation-results.operation-success_copy-url'),
    })
  }, [
    buildStudioUrl,
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
          tooltipProps={{content: t('action.copy-document-url.label')}}
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
