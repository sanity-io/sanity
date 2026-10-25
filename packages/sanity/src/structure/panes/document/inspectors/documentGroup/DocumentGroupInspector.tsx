import {Card} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {
  type DocumentInspectorProps,
  readVersionType,
  useClient,
  useDocumentStore,
  useTranslation,
} from 'sanity'
import {Flex} from 'ui5'

import {
  DocumentGroupInventory,
  type DocumentGroupInventoryHandle,
} from '../../../../../core/documentGroupInventory/components/DocumentGroupInventory'
import {DocumentGroupInventoryFeedbackAction} from '../../../../../core/documentGroupInventory/components/DocumentGroupInventoryFeedbackAction'
import {type DocumentGroupInventoryComponents} from '../../../../../core/documentGroupInventory/types'
import {useSetVariant} from '../../../../../core/perspective/useSetVariant'
import {type VersionInfoDocumentStub} from '../../../../../core/releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../../../core/releases/util/getReleaseIdFromReleaseDocumentId'
import {isGoingToUnpublish} from '../../../../../core/releases/util/isGoingToUnpublish'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../core/studioClient'
import {getDocumentVersionVariantId} from '../../../../../core/util/getDocumentVersionVariant'
import {ReferencePreviewLink} from '../../../../components/confirmDeleteDialog/ReferencePreviewLink'
import {referringDocuments} from '../../../../components/confirmDeleteDialog/useReferringDocuments'
import {VersionsPreviewList} from '../../../../components/confirmDeleteDialog/VersionsPreviewList'
import {DocTitle} from '../../../../components/DocTitle'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../../constants'
import {useDocumentPerspectiveList} from '../../../../hooks/useDocumentPerspectiveList'
import {structureLocaleNamespace} from '../../../../i18n'
import {DocumentInspectorHeader} from '../../documentInspector/DocumentInspectorHeader'
import {useDocumentPane} from '../../useDocumentPane'
import {documentGroupInventoryContainer} from './DocumentGroupInspector.css'

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
        title={t('document-group-inventory.action.manage-versions')}
      />
      <Card className={documentGroupInventoryContainer} flex={1}>
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
          />
        )}
      </Card>
    </Flex>
  )
}
