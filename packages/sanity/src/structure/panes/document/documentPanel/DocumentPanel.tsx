import {BoundaryElementProvider, Box, Flex, PortalProvider, usePortal} from '@sanity/ui'
import {useEffect, useMemo, useRef, useState} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getVersionFromId,
  isCardinalityOneRelease,
  isDocumentInSelectedVariant,
  getTargetDocument,
  isDraftId,
  isGoingToUnpublish,
  isNewDocument,
  isPausedCardinalityOneRelease,
  isPerspectiveWriteable,
  isReleaseDocument,
  isReleaseScheduledOrScheduling,
  isSystemBundle,
  LegacyLayerProvider,
  type ReleaseDocument,
  ScrollContainer,
  useArchivedReleases,
  useDocumentVersions,
  useFilteredReleases,
  usePausedScheduledDraft,
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
import {DocumentNotInReleaseBanner} from './banners/DocumentNotInReleaseBanner'
import {DocumentNotInVariantBanner} from './banners/DocumentNotInVariantBanner'
import {ObsoleteDraftBanner} from './banners/ObsoleteDraftBanner'
import {OpenReleaseToEditBanner} from './banners/OpenReleaseToEditBanner'
import {PausedScheduledDraftBanner} from './banners/PausedScheduledDraftBanner'
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

  const {params} = usePaneRouter()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {collapsed} = usePane()
  const parentPortal = usePortal()
  const {features} = useStructureTool()
  const [_portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
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
    ? _portalElement || parentPortal.element
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

  const prevDocumentIdRef = useRef<string | undefined>(undefined)

  // Scroll to top when `documentId` changes (but not on initial render)
  useEffect(() => {
    if (!documentScrollElement?.scrollTo) return

    // Skip scroll on initial render
    if (prevDocumentIdRef.current === undefined) {
      prevDocumentIdRef.current = documentId
      return
    }

    // Only scroll if documentId actually changed
    if (prevDocumentIdRef.current !== documentId) {
      documentScrollElement.scrollTo(0, 0)
      prevDocumentIdRef.current = documentId
    }
  }, [documentId, documentScrollElement])

  // Pass portal element to `DocumentPane`
  useEffect(() => {
    if (portalElement) {
      setDocumentPanelPortalElement(portalElement)
    }
  }, [portalElement, setDocumentPanelPortalElement])

  const inspectDialog = useMemo(() => {
    return isInspectOpen ? (
      <LegacyLayerProvider zOffset="inspectorDialog">
        <InspectDialog value={displayed || value} />
      </LegacyLayerProvider>
    ) : null
  }, [isInspectOpen, displayed, value])

  const showInspector = Boolean(!collapsed && inspector)
  const {bundle, selectedReleaseId, selectedPerspectiveName, selectedVariant, selectedPerspective} =
    usePerspective()

  const documentVersions = useDocumentVersions({documentId})
  const targetDocument = getTargetDocument({
    variant: selectedVariant?._id,
    bundle: bundle,
    documentVersions: documentVersions.versions,
  })
  const hasDocumentInRelease = selectedPerspectiveName && Boolean(targetDocument)

  const filteredReleases = useFilteredReleases({
    historyVersion: params?.historyVersion,
    displayed,
    documentId,
  })

  const {isPaused: isPausedDraft} = usePausedScheduledDraft()

  const {data: archivedReleases} = useArchivedReleases()

  // When viewing an archived scheduled draft, the release is no longer among the
  // active releases, so `selectedPerspective` falls back to a plain release-id
  // string. Resolve the selected release from the archived releases and inspect
  // its state directly: a scheduled draft is a cardinality-one release. This lets
  // us show the archived release banner instead of the "add to release" banner.
  const archivedScheduledDraftRelease = useMemo(
    () =>
      archivedReleases.find(
        (release) =>
          getReleaseIdFromReleaseDocumentId(release._id) === selectedPerspectiveName &&
          isCardinalityOneRelease(release),
      ),
    [archivedReleases, selectedPerspectiveName],
  )
  const isInSelectedVariant =
    selectedVariant && !documentVersions.loading
      ? isDocumentInSelectedVariant({
          selectedVariant,
          bundle,
          documentVersions: documentVersions.versions,
        })
      : true

  const banners = useMemo(() => {
    const archivedReleaseId =
      params?.historyVersion ??
      (archivedScheduledDraftRelease
        ? getReleaseIdFromReleaseDocumentId(archivedScheduledDraftRelease._id)
        : undefined)
    if (archivedReleaseId) {
      return <ArchivedReleaseDocumentBanner releaseId={archivedReleaseId} />
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

    if (isPausedDraft && displayed?._id) {
      return <PausedScheduledDraftBanner />
    }

    if (documentInScheduledRelease) {
      return <ScheduledReleaseBanner currentRelease={selectedPerspective as ReleaseDocument} />
    }

    const allFilteredReleases = [
      ...filteredReleases.currentReleases,
      ...filteredReleases.notCurrentReleases,
    ]
    // if the scheduled draft is paused then it will be available in notCurrentReleases
    // otherwise a locked-in scheduled draft will be available in currentReleases
    // so must look across both to find the scheduled draft release
    const scheduledCardinalityOneRelease = allFilteredReleases.find(
      (release) =>
        isCardinalityOneRelease(release) &&
        (isReleaseScheduledOrScheduling(release) || isPausedCardinalityOneRelease(release)),
    )

    const isPinnedDraftOrPublish = isSystemBundle(selectedPerspective)

    if (!isInSelectedVariant) {
      return <DocumentNotInVariantBanner />
    }

    const isCurrentVersionGoingToUnpublish =
      editState?.version && isGoingToUnpublish(editState?.version)

    if (
      !isSystemBundle(selectedPerspective) &&
      displayed?._id &&
      selectedPerspectiveName &&
      !hasDocumentInRelease &&
      ready &&
      !isPinnedDraftOrPublish &&
      isNewDocument(editState) === false &&
      !isCurrentVersionGoingToUnpublish
    ) {
      return (
        <DocumentNotInReleaseBanner
          documentId={value._id}
          currentRelease={selectedPerspective}
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
    const displayedIsDraft = displayed?._id && isDraftId(displayed._id)

    return (
      <>
        {selectedPerspective === 'drafts' && scheduledCardinalityOneRelease && displayedIsDraft && (
          <ScheduledDraftOverrideBanner
            releaseId={scheduledCardinalityOneRelease._id}
            draftDocument={displayed}
          />
        )}
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
    archivedScheduledDraftRelease,
    selectedPerspective,
    displayed,
    selectedReleaseId,
    selectedPerspectiveName,
    editState,
    hasDocumentInRelease,
    ready,
    activeView.type,
    isPermissionsLoading,
    permissions?.granted,
    requiredPermission,
    documentId,
    value._id,
    schemaType,
    filteredReleases,
    workspace,
    isPausedDraft,
    isInSelectedVariant,
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
          <Flex height="fill" direction="column" flex={2}>
            <LegacyLayerProvider zOffset="paneHeader">
              {banners}
              <DocumentPanelSubHeader />
            </LegacyLayerProvider>
            <DocumentBox flex={2}>
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

                    <div data-testid="document-panel-portal" ref={setPortalElement} />
                  </VirtualizerScrollInstanceProvider>
                </BoundaryElementProvider>
              </PortalProvider>
            </DocumentBox>

            {footer}
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
