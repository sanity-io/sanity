import {DocumentsIcon} from '@sanity/icons/Documents'
import {useEffect, useMemo, useRef, useState} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  DocumentGroupInventory,
  type DocumentGroupInventoryComponents,
  DocumentGroupInventoryFeedbackAction,
  type DocumentGroupInventoryHandle,
  type DocumentInspectorProps,
  getDocumentVersionVariantId,
  getReleaseIdFromReleaseDocumentId,
  isGoingToUnpublish,
  readVersionType,
  useClient,
  useDocumentStore,
  useSetVariant,
  useTranslation,
  type VersionInfoDocumentStub,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {Flex} from 'ui5'

import {ReferencePreviewLink} from '../../../../components/confirmDeleteDialog/ReferencePreviewLink'
import {referringDocuments} from '../../../../components/confirmDeleteDialog/useReferringDocuments'
import {VersionsPreviewList} from '../../../../components/confirmDeleteDialog/VersionsPreviewList'
import {DocTitle} from '../../../../components/DocTitle'
import {usePaneLayout} from '../../../../components/pane/usePaneLayout'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../../constants'
import {useDocumentPerspectiveList} from '../../../../hooks/useDocumentPerspectiveList'
import {structureLocaleNamespace} from '../../../../i18n'
import {CREATE_VARIANT_PARAM, EMPTY_PARAMS} from '../../constants'
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
  const {displayed, editState} = useDocumentPane()
  const {collapsed: layoutCollapsed} = usePaneLayout()

  const perspectiveList = useDocumentPerspectiveList()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentStore = useDocumentStore()
  const referringDocuments$ = useMemo(
    () => referringDocuments({documentId, versionedClient: client, documentStore}),
    [documentId, client, documentStore],
  )

  const setVariant = useSetVariant()
  const paneRouter = usePaneRouter()

  // Once the last version is gone there is no document left to show: close the pane, as the
  // document menu's delete does, rather than leave an empty, editable form behind.
  function handleAllVersionsDeleted() {
    paneRouter.closeCurrentAndAfter()
  }

  const [inventory, setInventory] = useState<DocumentGroupInventoryHandle | null>(null)

  // `createVariant=<variant id>` (see CREATE_VARIANT_PARAM) opens the Create variant form for that
  // variant. Once the form closes, the param goes, replacing the history entry rather than adding
  // one, so Back does not open the form again.
  const {params = EMPTY_PARAMS, createPathWithParams} = usePaneRouter()
  const {navigateUrl} = useRouter()
  const createVariantId = params[CREATE_VARIANT_PARAM] || undefined
  const latestPaneRouter = useRef({params, createPathWithParams, navigateUrl})
  useEffect(() => {
    latestPaneRouter.current = {params, createPathWithParams, navigateUrl}
  })
  // Deferred a tick, so the param is cleared from the router state that creating the variant
  // navigated to (it switches the pane to the new variant), not from the one before it.
  const handleCreateVariantClose = () => {
    setTimeout(() => {
      const latest = latestPaneRouter.current
      if (!latest.params[CREATE_VARIANT_PARAM]) return
      latest.navigateUrl({
        path: latest.createPathWithParams({...latest.params, [CREATE_VARIANT_PARAM]: undefined}),
        replace: true,
      })
    }, 0)
  }

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

  return (
    <Flex flexDirection="column" height="100%" overflow="hidden">
      <DocumentInspectorHeader
        actions={
          inventory && <DocumentGroupInventoryFeedbackAction inventory={inventory.inventory} />
        }
        as="header"
        closeButtonLabel={structureT('document-inspector.error.close-button.aria-label')}
        flex="none"
        // The icon of the Manage versions button in the bottom bar
        icon={DocumentsIcon}
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
            documentType={documentType}
            portalElementName={DOCUMENT_PANEL_PORTAL_ELEMENT}
            perspectiveList={perspectiveList}
            referringDocuments$={referringDocuments$}
            components={documentGroupInventoryComponents}
            onSelect={selectDocumentGroupVariant}
            createVariantId={createVariantId}
            onCreateVariantClose={handleCreateVariantClose}
            onAllVersionsDeleted={handleAllVersionsDeleted}
          />
        )}
      </div>
    </Flex>
  )
}
