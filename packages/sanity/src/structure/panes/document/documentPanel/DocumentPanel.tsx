import {BoundaryElementProvider, Box, Flex, PortalProvider, usePortal} from '@sanity/ui'
import {useEffect, useMemo, useRef, useState} from 'react'
import {
  getSanityCreateLinkMetadata,
  getVersionFromId,
  isCardinalityOneRelease,
  isGoingToUnpublish,
  isNewDocument,
  isPerspectiveWriteable,
  isReleaseDocument,
  isReleaseScheduledOrScheduling,
  isSanityCreateLinked,
  isSystemBundle,
  LegacyLayerProvider,
  type ReleaseDocument,
  ScrollContainer,
  useFilteredReleases,
  usePerspective,
  useWorkspace,
  VirtualizerScrollInstanceProvider,
} from 'sanity'
import {css, styled} from 'styled-components'

import {PaneContent, usePane, usePaneLayout, usePaneRouter} from '../../../components'
import {hasObsoleteDraft} from '../../../hasObsoleteDraft'
import {mustChooseNewDocumentDestination} from '../../../mustChooseNewDocumentDestination'
import {useStructureTool} from '../../../useStructureTool'
import {DocumentInspectorPanel} from '../documentInspector'
import {InspectDialog} from '../inspectDialog'
import {useDocumentPane} from '../useDocumentPane'
import {
  DeletedDocumentBanners,
  DeprecatedDocumentTypeBanner,
  InsufficientPermissionBanner,
  ReferenceChangedBanner,
  ScheduledDraftOverrideBanner,
} from './banners'
import {ArchivedReleaseDocumentBanner} from './banners/ArchivedReleaseDocumentBanner'
import {CanvasLinkedBanner} from './banners/CanvasLinkedBanner'
import {ChooseNewDocumentDestinationBanner} from './banners/ChooseNewDocumentDestinationBanner'
import {CreateLinkedBanner} from './banners/CreateLinkedBanner'
import {DocumentNotInReleaseBanner} from './banners/DocumentNotInReleaseBanner'
import {ObsoleteDraftBanner} from './banners/ObsoleteDraftBanner'
import {OpenReleaseToEditBanner} from './banners/OpenReleaseToEditBanner'
import {RevisionNotFoundBanner} from './banners/RevisionNotFoundBanner'
import {ScheduledReleaseBanner} from './banners/ScheduledReleaseBanner'
import {UnpublishedDocumentBanner} from './banners/UnpublishedDocumentBanner'
import {FormView} from './documentViews'
import {DocumentPanelSubHeader} from './header/DocumentPanelSubHeader'

interface DocumentPanelProps {
  footerHeight: number | null
  headerHeight: number | null
  isInspectOpen: boolean
  rootElement: HTMLDivElement | null
  setDocumentFormPortalElement: (el: HTMLElement | null) => void
  setDocumentPanelPortalElement: (el: HTMLElement | null) => void
  footer: React.ReactNode
}

const DocumentBox = styled(Box)({
  position: 'relative',
})

const Scroller = styled(ScrollContainer)<{$disabled: boolean}>(({$disabled}) => {
  if ($disabled) {
    return {height: '100%'}
  }

  return css`
    height: 100%;
    overflow: auto;
    position: relative;
    scroll-behavior: smooth;
    outline: none;
  `
})

export const DocumentPanel = function DocumentPanel(props: DocumentPanelProps) {
  const {
    footerHeight,
    headerHeight,
    isInspectOpen,
    rootElement,
    setDocumentFormPortalElement,
    setDocumentPanelPortalElement,
    footer,
  } = props
  const {
    activeViewId,
    displayed,
    documentId,
    editState,
    inspector,
    value,
    views,
    ready,
    schemaType,
    permissions,
    isPermissionsLoading,
  } = useDocumentPane()
  const createLinkMetadata = getSanityCreateLinkMetadata(value)
  const showCreateBanner = isSanityCreateLinked(createLinkMetadata)

  const {params} = usePaneRouter()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {collapsed} = usePane()
  const parentPortal = usePortal()
  const {features} = useStructureTool()
  const [_formPortalElement, setFormPortalElement] = useState<HTMLDivElement | null>(null)
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const formContainerElement = useRef<HTMLFormElement | null>(null)
  const workspace = useWorkspace()

  const requiredPermission = value._createdAt ? 'update' : 'create'

  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) || views[0] || {type: 'form'},
    [activeViewId, views],
  )

  // Use a local portal container when split panes is supported
  const portalElement: HTMLElement | null = features.splitPanes
    ? _formPortalElement || parentPortal.element
    : parentPortal.element

  // Calculate the height of the header
  const margins: [number, number, number, number] = useMemo(() => {
    if (layoutCollapsed) {
      return [headerHeight || 0, 0, footerHeight ? footerHeight + 2 : 2, 0]
    }

    return [0, 0, 2, 0]
  }, [layoutCollapsed, footerHeight, headerHeight])

  const formViewHidden = activeView.type !== 'form'

  const activeViewNode = useMemo(() => {
    if (activeView.type === 'component' && activeView.component) {
      const ActiveViewComponent = activeView.component
      return (
        <ActiveViewComponent
          document={{
            draft: editState?.draft || null,
            displayed: displayed || value,
            historical: displayed,
            published: editState?.published || null,
          }}
          documentId={documentId}
          options={activeView.options}
          schemaType={schemaType}
        />
      )
    }
    return false
  }, [activeView, displayed, documentId, editState?.draft, editState?.published, schemaType, value])

  // Scroll to top as `documentId` changes
  useEffect(() => {
    if (!documentScrollElement?.scrollTo) return
    documentScrollElement.scrollTo(0, 0)
  }, [documentId, documentScrollElement])

  // Pass portal element to `DocumentPane`
  useEffect(() => {
    if (portalElement) {
      setDocumentFormPortalElement(portalElement)
    }
  }, [portalElement, setDocumentFormPortalElement])

  const inspectDialog = useMemo(() => {
    return isInspectOpen ? <InspectDialog value={displayed || value} /> : null
  }, [isInspectOpen, displayed, value])

  const showInspector = Boolean(!collapsed && inspector)
  const {selectedPerspective, selectedReleaseId} = usePerspective()

  const filteredReleases = useFilteredReleases({
    historyVersion: params?.historyVersion,
    displayed,
    documentId,
  })

  // eslint-disable-next-line complexity
  const banners = useMemo(() => {
    if (params?.historyVersion) {
      return <ArchivedReleaseDocumentBanner />
    }

    const isScheduledRelease =
      isReleaseDocument(selectedPerspective) && isReleaseScheduledOrScheduling(selectedPerspective)

    const documentInScheduledRelease = Boolean(
      isScheduledRelease &&
        displayed?._id &&
        getVersionFromId(displayed?._id) === selectedReleaseId,
    )

    const isSelectedPerspectiveWriteable = isPerspectiveWriteable({
      selectedPerspective,
      isDraftModelEnabled: workspace.document.drafts.enabled,
      schemaType,
    })

    if (
      mustChooseNewDocumentDestination({
        isSelectedPerspectiveWriteable,
        editState,
      })
    ) {
      return (
        !isSelectedPerspectiveWriteable.result && (
          <ChooseNewDocumentDestinationBanner
            schemaType={schemaType}
            selectedPerspective={selectedPerspective}
            reason={isSelectedPerspectiveWriteable.reason}
          />
        )
      )
    }

    if (documentInScheduledRelease) {
      return <ScheduledReleaseBanner currentRelease={selectedPerspective as ReleaseDocument} />
    }

    const hasCardinalityOneReleases = filteredReleases.currentReleases.some(isCardinalityOneRelease)
    if (selectedPerspective === 'drafts' && hasCardinalityOneReleases) {
      return <ScheduledDraftOverrideBanner />
    }

    const isPinnedDraftOrPublish = isSystemBundle(selectedPerspective)
    const isCurrentVersionGoingToUnpublish =
      editState?.version && isGoingToUnpublish(editState?.version)

    if (
      displayed?._id &&
      getVersionFromId(displayed._id) !== selectedReleaseId &&
      ready &&
      !isPinnedDraftOrPublish &&
      isNewDocument(editState) === false &&
      !isCurrentVersionGoingToUnpublish
    ) {
      return (
        <DocumentNotInReleaseBanner
          documentId={value._id}
          currentRelease={selectedPerspective as ReleaseDocument}
          isScheduledRelease={isScheduledRelease}
        />
      )
    }

    const displayedHasObsoleteDraft = hasObsoleteDraft({
      editState,
      workspace,
      schemaType,
    })

    if (activeView.type === 'form' && !selectedReleaseId && displayedHasObsoleteDraft.result) {
      if (displayedHasObsoleteDraft.reason === 'DRAFT_MODEL_INACTIVE') {
        return (
          <ObsoleteDraftBanner
            displayed={displayed}
            documentId={documentId}
            schemaType={schemaType}
            i18nKey="banners.obsolete-draft.draft-model-inactive.text"
          />
        )
      }

      if (displayedHasObsoleteDraft.reason === 'LIVE_EDIT_ACTIVE') {
        return (
          <ObsoleteDraftBanner
            displayed={displayed}
            documentId={documentId}
            schemaType={schemaType}
            i18nKey="banners.live-edit-draft-banner.text"
            isEditBlocking
          />
        )
      }
    }

    if (activeView.type !== 'form' || isPermissionsLoading) return null

    return (
      <>
        {showCreateBanner && <CreateLinkedBanner />}
        {!permissions?.granted && (
          <InsufficientPermissionBanner requiredPermission={requiredPermission} />
        )}
        <RevisionNotFoundBanner />
        <ReferenceChangedBanner />
        <DeprecatedDocumentTypeBanner />
        <CanvasLinkedBanner />
        <DeletedDocumentBanners />
        <UnpublishedDocumentBanner />
        <OpenReleaseToEditBanner
          documentId={displayed?._id ?? documentId}
          isPinnedDraftOrPublished={isPinnedDraftOrPublish}
        />
      </>
    )
  }, [
    params?.historyVersion,
    selectedPerspective,
    displayed,
    selectedReleaseId,
    editState,
    ready,
    activeView.type,
    isPermissionsLoading,
    showCreateBanner,
    permissions?.granted,
    requiredPermission,
    documentId,
    value._id,
    schemaType,
    filteredReleases,
    workspace,
  ])
  const portalElements = useMemo(
    () => ({documentScrollElement: documentScrollElement}),
    [documentScrollElement],
  )
  const showFormView = features.resizablePanes || !showInspector
  return (
    <PaneContent>
      <Flex height="fill">
        {showFormView && (
          <Flex height="fill" direction="column" width="fill" flex={2}>
            <LegacyLayerProvider zOffset="paneHeader">
              {banners}
              <DocumentPanelSubHeader />
            </LegacyLayerProvider>
            <DocumentBox flex={2} overflow="hidden">
              <PortalProvider element={portalElement} __unstable_elements={portalElements}>
                <BoundaryElementProvider element={documentScrollElement}>
                  <VirtualizerScrollInstanceProvider
                    scrollElement={documentScrollElement}
                    containerElement={formContainerElement}
                  >
                    <Scroller
                      $disabled={layoutCollapsed || false}
                      data-testid="document-panel-scroller"
                      ref={setDocumentScrollElement}
                    >
                      <FormView
                        hidden={formViewHidden}
                        margins={margins}
                        ref={formContainerElement}
                      />
                      {activeViewNode}
                    </Scroller>

                    {inspectDialog}

                    <div data-testid="document-panel-portal" ref={setFormPortalElement} />
                  </VirtualizerScrollInstanceProvider>
                </BoundaryElementProvider>
              </PortalProvider>
            </DocumentBox>

            {footer}

            <div data-portal="" ref={setDocumentPanelPortalElement} />
          </Flex>
        )}
        {showInspector && (
          <BoundaryElementProvider element={rootElement}>
            <DocumentInspectorPanel
              documentId={documentId}
              documentType={schemaType.name}
              flex={1}
            />
          </BoundaryElementProvider>
        )}
      </Flex>
    </PaneContent>
  )
}
DocumentPanel.displayName = 'DocumentPanel'
