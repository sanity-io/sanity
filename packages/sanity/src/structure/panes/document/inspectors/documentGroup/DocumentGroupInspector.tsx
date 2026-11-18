import {useMemo, useState} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  DocumentGroupInventory,
  type DocumentGroupInventoryComponents,
  DocumentGroupInventoryFeedbackAction,
  type DocumentGroupInventoryHandle,
  type DocumentInspectorProps,
  type EditStateFor,
  getDefaultVariant,
  getDraftId,
  getDocumentVersionVariantId,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  isGoingToUnpublish,
  readVersionType,
  type TargetDocumentState,
  useClient,
  useDocumentStore,
  usePerspective,
  useSetVariant,
  useTranslation,
  type VersionInfoDocumentStub,
} from 'sanity'
import {Flex} from 'ui5'

import {ReferencePreviewLink} from '../../../../components/confirmDeleteDialog/ReferencePreviewLink'
import {referringDocuments} from '../../../../components/confirmDeleteDialog/useReferringDocuments'
import {VersionsPreviewList} from '../../../../components/confirmDeleteDialog/VersionsPreviewList'
import {DocTitle} from '../../../../components/DocTitle'
import {usePaneLayout} from '../../../../components/pane/usePaneLayout'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../../constants'
import {useDocumentPerspectiveList} from '../../../../hooks/useDocumentPerspectiveList'
import {structureLocaleNamespace} from '../../../../i18n'
import {DocumentInspectorHeader} from '../../documentInspector/DocumentInspectorHeader'
import {useDocumentPane} from '../../useDocumentPane'
import {CompareVersionsAction} from './CompareVersionsAction'
import {documentGroupInventoryContainer} from './DocumentGroupInspector.css'

const documentGroupInventoryComponents: DocumentGroupInventoryComponents = {
  DocTitle,
  ReferencePreviewLink,
  VersionsPreviewList,
  CompareVersionsAction,
}

export function DocumentGroupInspector(props: DocumentInspectorProps): React.JSX.Element {
  const {documentId, documentType, onClose} = props
  const {t} = useTranslation()
  const {t: structureT} = useTranslation(structureLocaleNamespace)
  const {displayed, editState, targetDocumentState} = useDocumentPane()
  const {selectedPerspective, selectedVariantNames} = usePerspective()
  const {collapsed: layoutCollapsed} = usePaneLayout()

  const perspectiveList = useDocumentPerspectiveList()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentStore = useDocumentStore()
  const referringDocuments$ = useMemo(
    () => referringDocuments({documentId, versionedClient: client, documentStore}),
    [documentId, client, documentStore],
  )

  const setVariant = useSetVariant()

  const [inventory, setInventory] = useState<DocumentGroupInventoryHandle | null>(null)

  // Picking a version in the inventory switches the pane to it.
  function selectDocumentGroupVariant(document: VersionInfoDocumentStub) {
    let bundle

    switch (readVersionType(document)) {
      case 'release':
        bundle = getReleaseIdFromReleaseDocumentId(document._system.release?._ref ?? '')
        break
      case 'published':
        bundle = 'published'
        break
      case 'draft':
        bundle = 'drafts'
        break
      case 'agent':
        bundle = document._system.bundleId
    }

    const variantId = getDocumentVersionVariantId(document)

    setVariant({variantId, perspective: bundle})
  }

  // When a document is designated to be unpublished in a release, the published
  // document is displayed instead. The document group inventory must always reflect
  // the intended document id.
  const targetDocumentId =
    editState?.version && isGoingToUnpublish(editState?.version)
      ? editState.version._id
      : displayed?._id

  const variantSelected = Boolean(getDefaultVariant(selectedVariantNames))
  // In Drafts, a draft the first edit will create shows in the inventory as a ghost row, marked open
  const pendingDraft = getPendingDraft({
    targetDocumentState,
    variantSelected,
    draftsSelected: selectedPerspective === 'drafts',
    editState,
    documentId,
    defaultName: t('document-group.base-variant'),
  })
  const selectedId =
    pendingDraft?.id ??
    getSelectedVersionId({
      targetDocumentState,
      variantSelected,
      targetDocumentId,
    })

  return (
    <Flex flexDirection="column" height="100%" overflow="hidden">
      <DocumentInspectorHeader
        actions={
          inventory && <DocumentGroupInventoryFeedbackAction inventory={inventory.inventory} />
        }
        as="header"
        closeButtonLabel={structureT('document-inspector.error.close-button.aria-label')}
        flex="none"
        onClose={onClose}
        title={t('document-group-inventory.panel-title')}
      />
      <div
        className={documentGroupInventoryContainer}
        data-testid="document-group-inspector-content"
        data-document-group-inventory-scroll={layoutCollapsed ? 'ancestor' : undefined}
      >
        {typeof targetDocumentId !== 'undefined' && (
          <DocumentGroupInventory
            // The inventory's machines read their input once, so they must be recreated when the
            // document changes.
            key={documentId}
            ref={setInventory}
            mode="manage"
            documentId={targetDocumentId}
            selectedId={selectedId}
            pendingDraft={pendingDraft}
            documentType={documentType}
            portalElementName={DOCUMENT_PANEL_PORTAL_ELEMENT}
            perspectiveList={perspectiveList}
            referringDocuments$={referringDocuments$}
            components={documentGroupInventoryComponents}
            onSelect={selectDocumentGroupVariant}
          />
        )}
      </div>
    </Flex>
  )
}

/**
 * The draft the form is about to create, if any. In Drafts, when the open audience has no draft
 * yet, the form shows its published version and the first edit creates the draft: for a variant,
 * at the id the target state reserves (`creatableTarget`); for Default, at the document's draft
 * id. Live-edit documents have no drafts, so they never have one.
 */
function getPendingDraft({
  targetDocumentState,
  variantSelected,
  draftsSelected,
  editState,
  documentId,
  defaultName,
}: {
  targetDocumentState: TargetDocumentState
  variantSelected: boolean
  draftsSelected: boolean
  editState: EditStateFor | null
  documentId: string
  defaultName: string
}): {id: string; variantId?: string; name: string} | undefined {
  if (!draftsSelected) {
    return undefined
  }
  if (variantSelected) {
    if (targetDocumentState.status !== 'variant-missing' || !targetDocumentState.creatableTarget) {
      return undefined
    }
    const {variant, creatableTarget} = targetDocumentState
    return {
      id: creatableTarget.id,
      variantId: variant._id,
      name: variant.metadata?.title ?? variant.name ?? variant._id,
    }
  }
  if (
    !editState?.ready ||
    editState.liveEdit ||
    editState.draft ||
    editState.version ||
    !editState.published
  ) {
    return undefined
  }
  return {id: getDraftId(getPublishedId(documentId)), name: defaultName}
}

/**
 * The version the inventory marks as open. With a variant selected, the displayed document falls
 * back to the base pair while the variant target resolves, so it would briefly mark the Default
 * row. The resolved variant target is the source instead, and nothing is marked until it is known.
 */
function getSelectedVersionId({
  targetDocumentState,
  variantSelected,
  targetDocumentId,
}: {
  targetDocumentState: TargetDocumentState
  variantSelected: boolean
  targetDocumentId: string | undefined
}): string | null | undefined {
  if (!variantSelected) {
    return targetDocumentId
  }
  if (targetDocumentState.status === 'ready' && targetDocumentState.targetDocument) {
    return targetDocumentState.targetDocument._id
  }
  return null
}
