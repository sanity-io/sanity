import {LinkIcon} from '@sanity/icons/Link'
import {ShareIcon} from '@sanity/icons/Share'
import {TargetIcon} from '@sanity/icons/Target'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu} from '@sanity/ui/menu'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo} from 'react'
import {
  getDraftId,
  getTargetSiblings,
  usePerspective,
  useStudioUrl,
  useTargetDocumentState,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../../ui-components/button/Button'
import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {DocumentIDCopied, DocumentURLCopied} from '../../__telemetry__/documentPanes.telemetry'
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
  const targetDocumentState = useTargetDocumentState(documentId)
  const siblings = getTargetSiblings(targetDocumentState)
  const {selectedReleaseId, selectedPerspectiveName, selectedVariantName} = usePerspective()
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
      return siblings?.version?._id
    }
    if (selectedPerspectiveName === 'published' || schemaType?.liveEdit) {
      return siblings?.published?._id
    }
    if (siblings?.draft) {
      return siblings.draft._id
    }
    // Published shown on the draft perspective: a creatable draft (default pseudo-draft, or a
    // missing variant whose published sibling advertises the draft id).
    if (!siblings?.published) {
      return undefined
    }
    const advertisedDraftId = siblings.published._system?.draft?._ref

    return siblings.published._system?.variant ? advertisedDraftId : getDraftId(documentId)
  }, [
    documentId,
    scheduledDraft,
    schemaType?.liveEdit,
    selectedPerspectiveName,
    selectedReleaseId,
    siblings,
  ])

  const handleCopyLink = useCallback(async () => {
    telemetry.log(DocumentURLCopied)

    const searchParams: [string, string][] =
      selectedReleaseId && !scheduledDraft ? [['perspective', selectedReleaseId]] : []

    if (selectedVariantName) {
      searchParams.push(['variant', selectedVariantName])
    }

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
    selectedVariantName,
    t,
    telemetry,
  ])

  const handleCopyId = useCallback(async () => {
    if (!contextAwareDocumentId) {
      return
    }
    telemetry.log(DocumentIDCopied)
    await navigator.clipboard.writeText(contextAwareDocumentId)
    pushToast({
      id: 'copy-document-id',
      status: 'info',
      title: t('panes.document-operation-results.operation-success_copy-id'),
    })
  }, [contextAwareDocumentId, pushToast, t, telemetry])

  if (!contextAwareDocumentId) {
    return null
  }

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
