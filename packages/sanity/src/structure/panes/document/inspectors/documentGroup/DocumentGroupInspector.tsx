import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  DocumentGroupInventory,
  type DocumentGroupInventoryComponents,
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
import {Flex} from 'ui5'

import {ReferencePreviewLink} from '../../../../components/confirmDeleteDialog/ReferencePreviewLink'
import {referringDocuments} from '../../../../components/confirmDeleteDialog/useReferringDocuments'
import {VersionsPreviewList} from '../../../../components/confirmDeleteDialog/VersionsPreviewList'
import {DocTitle} from '../../../../components/DocTitle'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../../constants'
import {useDocumentPerspectiveList} from '../../../../hooks/useDocumentPerspectiveList'
import {structureLocaleNamespace} from '../../../../i18n'
import {DocumentInspectorHeader} from '../../documentInspector/DocumentInspectorHeader'
import {useDocumentPane} from '../../useDocumentPane'

const documentGroupInventoryComponents: DocumentGroupInventoryComponents = {
  DocTitle,
  ReferencePreviewLink,
  VersionsPreviewList,
}

export function DocumentGroupInspector(props: DocumentInspectorProps): React.JSX.Element {
  const {documentId, documentType, onClose} = props
  const {t} = useTranslation()
  const {t: structureT} = useTranslation(structureLocaleNamespace)
  const {displayed, editState} = useDocumentPane()

  const perspectiveList = useDocumentPerspectiveList()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentStore = useDocumentStore()
  const referringDocuments$ = useMemo(
    () => referringDocuments({documentId, versionedClient: client, documentStore}),
    [documentId, client, documentStore],
  )

  const setVariant = useSetVariant()

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
        as="header"
        closeButtonLabel={structureT('document-inspector.error.close-button.aria-label')}
        flex="none"
        onClose={onClose}
        title={t('document-group-inventory.action.manage-versions')}
      />
      <Card flex={1} overflow="auto">
        {typeof targetDocumentId !== 'undefined' && (
          <DocumentGroupInventory
            // The inventory's machines read their input once, so they must be recreated when the
            // document changes.
            key={documentId}
            mode="manage"
            documentId={targetDocumentId}
            documentType={documentType}
            portalElementName={DOCUMENT_PANEL_PORTAL_ELEMENT}
            perspectiveList={perspectiveList}
            referringDocuments$={referringDocuments$}
            components={documentGroupInventoryComponents}
            onSelect={selectDocumentGroupVariant}
          />
        )}
      </Card>
    </Flex>
  )
}
